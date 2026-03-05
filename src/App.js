import React, { useState } from "react";

export default function DepositConfirmationModule() {
  const [role, setRole] = useState("maker");
  const [makerView, setMakerView] = useState("list");
  const [approverView, setApproverView] = useState("list");
  const [rows, setRows] = useState([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [approverTime, setApproverTime] = useState("");

  // simple filter state for maker/approver listing
  const [makerFilters, setMakerFilters] = useState({
    loan: "",
    bucket: "",
    status: "",
    branch: "",
  });
  const [approverFilters, setApproverFilters] = useState({
    maker: "",
    branch: "",
    status: "",
    loan: "",
  });

  // helper to produce a random 10-digit mobile number starting with 9
  const getRandomMobile = () => {
    // generate a number between 9000000000 and 9999999999
    return (
      Math.floor(9000000000 + Math.random() * 1000000000)
        .toString()
    );
  };

  // list of loan records shown in maker/approver tables
  // load initial data from localStorage if present, otherwise fall back
  // to hard‑coded examples.  changes to `records` are persisted so the
  // user won't lose entered details if they refresh the page.
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem("dc_records");
      if (stored) {
        const arr = JSON.parse(stored);
        // normalize old statuses and ensure new fields exist
        return arr.map((r) => ({
          ...r,
          status: r.status === "Pending Approval" ? "Submitted" : r.status,
          branch: r.branch || "",
          approver: r.approver || "",
          rejectRemark: r.rejectRemark || "",
        }));
      }
    } catch (e) {
      console.warn("failed to parse stored records", e);
    }
    return [
      {
        loan: "HL000001",
        userId: "AV45",
        userName: "Raj Kumar",
        customerName: "Customer 1",
        totalDues: "120000",
        emi: "10000",
        charges: "0",
        bucket: "90+",
        mobile: getRandomMobile(),
        branch: "",
        approver: "",
        rejectRemark: "",
        makerTime: "NA",
        approverTime: "NA",
        status: "Draft",
        rows: [], // store call connect rows
      },
      {
        loan: "HL000002",
        userId: "AV45",
        userName: "Raj Kumar",
        customerName: "Customer 2",
        totalDues: "120000",
        emi: "10000",
        charges: "0",
        bucket: "90+",
        mobile: getRandomMobile(),
        branch: "",
        approver: "",
        rejectRemark: "",
        makerTime: "NA",
        approverTime: "NA",
        status: "Draft",
        rows: [],
      },
    ];
  });

  const [currentIndex, setCurrentIndex] = useState(null);
  const currentRecord = currentIndex !== null ? records[currentIndex] : null;
  const isEditable = currentRecord ? currentRecord.status === "Draft" : false;

  const statusBadge = (status) => {
    const map = {
      Draft: "bg-gray-400",
      Submitted: "bg-blue-500",
      Approved: "bg-green-600",
      Rejected: "bg-red-600",
    };
    return (
      <span className={`text-white px-3 py-1 rounded-full text-xs ${map[status]}`}>
        {status}
      </span>
    );
  };

  // contact list including customer and relatives
  const contactList = [
    { name: "Raj Kumar", mobile: "9000012345", relation: "Self" },
    { name: "Aman", mobile: "7800082434", relation: "Brother" },
    { name: "Ramesh", mobile: "9876543210", relation: "Father" },
    { name: "Sita", mobile: "9123456780", relation: "Mother" },
    { name: "Neha", mobile: "9988776655", relation: "Spouse" },
  ];

  const addApplicant = () => {
    const rec = currentIndex !== null ? records[currentIndex] : null;
    if (rec && rec.status !== "Draft") return; // no additions after action
    const customerName = rec ? rec.userName : "";
    setRows([
      ...rows,
      {
        customer: customerName, // carry over from account details
        mobile: "",

        date: "",
        time: "",
        numberCorrect: "",
        amountCorrect: "",
        paidDateCorrect: "",
        remarks: "",
        saved: false,
        timestamp: "",
      },
    ]);
    // new row means unsaved changes exist
    setHasUnsaved(true);
  }; // no change in structure except contact list used in dropdown later

  // called when clicking take action / view details in either list
  const openDetails = (index) => {
    setCurrentIndex(index);
    // load any saved rows from record
    setRows(records[index].rows || []);
    setHasUnsaved(false);
    setMakerView("details");
    // reset approver flags when opening
    setApproved(false);
    setRejected(false);
    setApproverTime("");

    // populate branch/approver state if previously chosen
    const rec = records[index];
    const b = rec.branch || "";
    setBranch(b);
    setApproversList(b ? approversByBranch[b] || [] : []);
    setApprover(rec.approver || "");

    // NOTE: we no longer set the maker timestamp automatically when the
    // record is opened.  The time should only be recorded when the maker
    // explicitly saves or submits the record, otherwise the list view would
    // show a time just because the user peeked at the details.
  };

  const openReview = (index) => {
    setCurrentIndex(index);
    setRows(records[index].rows || []);
    setHasUnsaved(false);
    setApproverView("review");
    setApproved(false);
    setRejected(false);
    setApproverTime("");
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    updated[index].saved = false;
    setRows(updated);
    setHasUnsaved(true);
  }; // rows only saved into record when saveRow or submit occur

  const handleMobileRelationChange = (index, mobile) => {
    const entry = contactList.find((e) => e.mobile === mobile);
    const updated = [...rows];
    updated[index].mobile = mobile;
    // relationName no longer stored
    updated[index].saved = false;
    setRows(updated);
    setHasUnsaved(true);
  };

  const saveRow = (index, checked) => {
    const updated = [...rows];
    updated[index].saved = checked;
    if (checked) updated[index].timestamp = new Date().toLocaleString();
    setRows(updated);
    setHasUnsaved(false);
    // sync to record
    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[currentIndex].rows = updated;
        return copy;
      });
    }
  };

  const approveRecord = () => {
    setApproved(true);
    setRejected(false);
    const time = new Date().toLocaleString();
    setApproverTime(time);
    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[currentIndex].approverTime = time;
        copy[currentIndex].status = "Approved";
        copy[currentIndex].rejectRemark = "";
        return copy;
      });
    }
  };

  const rejectRecord = () => {
    if (!rejectionRemark) {
      alert("Rejection remark is mandatory");
      return;
    }
    setRejected(true);
    setApproved(false);
    const time = new Date().toLocaleString();
    setApproverTime(time);
    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[currentIndex].approverTime = time;
        copy[currentIndex].status = "Rejected";
        copy[currentIndex].rejectRemark = rejectionRemark;
        return copy;
      });
    }
  };

  const validateDate = (date) => {
    if (!date) return true;
    const selected = new Date(date);
    const now = new Date();
    const diff = Math.abs(now - selected) / (1000 * 60 * 60);
    return diff <= 48;
  };

  // ---- branch / approver selection logic for submission ----
  const branches = ["Andheri", "Borivali", "Vashi"];
  const approversByBranch = {
    Andheri: ["Approver A", "Approver B"],
    Borivali: ["Approver C"],
    Vashi: ["Approver D", "Approver E"],
  };
  const [branch, setBranch] = useState("");
  const [approver, setApprover] = useState("");
  const [approversList, setApproversList] = useState([]);

  const handleBranchChange = (b) => {
    setBranch(b);
    setApprover("");
    setApproversList(b ? approversByBranch[b] || [] : []);
  };

  // save call connect rows (and optionally branch/approver) without
  // requiring those selectors to be populated.  used by the Save button.
  const handleSave = () => {
    // when saving, stamp every row with current time and mark saved
    const stampedRows = rows.map((r) => ({
      ...r,
      timestamp: new Date().toLocaleString(),
      saved: true,
    }));
    setRows(stampedRows);

    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[currentIndex] = {
          ...copy[currentIndex],
          rows: stampedRows,
          makerTime: new Date().toLocaleString(),
          branch,
          approver,
        };
        return copy;
      });
    }
    setHasUnsaved(false);
  };

  // keep record rows in sync whenever they change, so reopening never
  // shows stale/empty data even if Save wasn't clicked (or state update
  // lags).  This is just a safety net.
  React.useEffect(() => {
    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        // copy existing record and replace rows with latest state
        copy[currentIndex] = { ...copy[currentIndex], rows };
        return copy;
      });
    }
  }, [rows, currentIndex]);

  const handleSubmitForApproval = () => {
    // guard should still exist even if button disabled
    if (!branch || !approver) {
      alert("Please select branch and approver before submitting");
      return;
    }
    if (hasUnsaved) {
      alert("Please save entered data before submit");
      return;
    }
    if (currentIndex !== null) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[currentIndex] = {
          ...copy[currentIndex],
          status: "Submitted",
          makerTime: new Date().toLocaleString(),
          rows,
          branch,
          approver,
          rejectRemark: "",
        };
        return copy;
      });
    }
    // reset branch/approver for next record
    setBranch("");
    setApprover("");
    setApproversList([]);
    setMakerView("list");
  };

  // persist record array to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("dc_records", JSON.stringify(records));
    } catch (e) {
      console.warn("failed to save records", e);
    }
  }, [records]);

  // apply filters to the lists before rendering
  const makerList = records.filter((r) => {
    if (makerFilters.loan && !r.loan.toLowerCase().includes(makerFilters.loan.toLowerCase())) return false;
    if (makerFilters.bucket && r.bucket !== makerFilters.bucket) return false;
    if (makerFilters.status && r.status !== makerFilters.status) return false;
    if (makerFilters.branch && r.branch !== makerFilters.branch) return false;
    return true;
  });

  const approverList = records.filter((r) => {
    if (r.status !== "Submitted") return false; // approver only works on submitted
    if (approverFilters.maker && r.userName !== approverFilters.maker) return false;
    if (approverFilters.branch && r.branch !== approverFilters.branch) return false;
    if (approverFilters.status && r.status !== approverFilters.status) return false;
    if (approverFilters.loan && !r.loan.toLowerCase().includes(approverFilters.loan.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-6" style={{ background: "#ebedfa" }}>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {role === "maker"
            ? "Deposit Confirmation – Maker"
            : "Deposit Confirmation – Approver"}
        </h1>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="maker">Maker</option>
          <option value="approver">Approver</option>
        </select>
      </div>

      {/* =========================== MAKER =========================== */}

      {role === "maker" && (
        <>
          {makerView === "list" && (
            <>
              <div className="bg-white rounded-2xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
                <input
                  placeholder="Loan Number"
                  value={makerFilters.loan}
                  onChange={(e) => setMakerFilters({ ...makerFilters, loan: e.target.value })}
                  className="border p-2 rounded"
                />
                <select
                  className="border p-2 rounded"
                  value={makerFilters.bucket}
                  onChange={(e) => setMakerFilters({ ...makerFilters, bucket: e.target.value })}
                >
                  <option value="">All Buckets</option>
                  <option>90+</option>
                  <option>30-60</option>
                </select>
                <select
                  className="border p-2 rounded"
                  value={makerFilters.status}
                  onChange={(e) => setMakerFilters({ ...makerFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option>Draft</option>
                  <option>Submitted</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
                <input
                  placeholder="Branch"
                  value={makerFilters.branch}
                  onChange={(e) => setMakerFilters({ ...makerFilters, branch: e.target.value })}
                  className="border p-2 rounded"
                />
                <button
                  className="bg-blue-600 text-white rounded-lg"
                  onClick={() => {}}
                >
                  Go
                </button>
                <button
                  className="bg-gray-200 rounded-lg"
                  onClick={() => setMakerFilters({ loan: "", bucket: "", status: "", branch: "" })}
                >
                  Reset
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-auto">
                <table className="table-auto w-full text-sm whitespace-normal">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-center font-semibold">Sr No</th>
                      <th className="p-3">Loan Number</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Bucket</th>
                      <th className="p-3">EMI</th>
                      <th className="p-3">Total Dues</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Maker Saved Time</th>
                      <th className="p-3">Approver Time</th>
                      <th className="p-3">Approver Name</th>
                      <th className="p-3">Reject Remark</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {makerList.map((rec, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.loan}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.customerName}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.mobile}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.bucket}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.emi}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.totalDues}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.branch || "-"}</td>
                        <td className="p-3 text-center whitespace-nowrap">{statusBadge(rec.status)}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.makerTime}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.approverTime}</td>
                        <td className="p-3 text-center whitespace-nowrap">{rec.approver || "-"}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {rec.status === "Rejected" ? rec.rejectRemark : ""}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => openDetails(records.indexOf(rec))}
                            className="bg-blue-600 text-white px-4 py-1 rounded-lg"
                          >
                            {rec.status === "Draft" ? "Take Action" : "View Details"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {makerView === "details" && (
            <>
              {/* Account Details */}
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="font-semibold mb-2">Account Details</h2>
                {currentIndex !== null && (
                  <div className="text-sm mb-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><b>Loan:</b> {records[currentIndex].loan}</div>
                    <div><b>Maker Time:</b> {records[currentIndex].makerTime}</div>
                    <div><b>Status:</b> {records[currentIndex].status}</div>
                    {records[currentIndex].status === "Rejected" && (
                      <div><b>Reject Remark:</b> {records[currentIndex].rejectRemark || "-"}</div>
                    )}
                    <div><b>Approver Time:</b> {records[currentIndex].approverTime}</div>
                    <div><b>Account Status:</b> Active</div>
                    <div><b>HL Number:</b> {records[currentIndex].loan}</div>
                    <div><b>Customer Name:</b> {records[currentIndex].userName}</div>
                    <div><b>EMI Amount:</b> 12000</div>
                    <div><b>Overdue Amount:</b> 35000</div>
                    <div><b>DPD:</b> 45</div>
                    <div><b>Last Paid Amount:</b> 10000</div>
                    <div><b>Date of Payment:</b> 10-Feb-2026</div>
                    <div><b>Customer Address:</b> Mumbai</div>
                    <div><b>Allocated ID:</b> AV45</div>
                    <div><b>Branch:</b> Andheri</div>
                    <div><b>State:</b> Maharashtra</div>
                  </div>
                )}
              </div>

              {/* Call Connect Details */}
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Call Connect Details</h2>

                  {/* Button style like screenshot */}
                  <button
                    onClick={addApplicant}
                    className={`bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isEditable}
                  >
                    + Add Applicant / Co-Applicant
                  </button>
                </div>

                <div className="overflow-auto">
                  <table className="table-fixed w-full text-sm border" style={{tableLayout:'fixed'}}>
                    <colgroup>
                      <col className="w-32" />
                      <col className="w-48" />
                      <col className="w-24" />
                      <col className="w-24" />
                      <col className="w-24" />
                      <col className="w-32" />
                      <col className="w-32" />
                      <col className="w-48" />
                      <col className="w-32" />
                    </colgroup>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3 w-64">Mobile No / Relation</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Time</th>
                        <th className="p-3">Number Correct?</th>
                        <th className="p-3">Last Amount Paid Correct?</th>
                        <th className="p-3">Last Paid Date Correct?</th>
                        <th className="p-3">Any Other Information</th>
                        <th className="p-3">Maker Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-center">
                            {/* display actual customer name from row or current record */}
                            {row.customer || (currentRecord ? currentRecord.customerName : "")}
                          </td>

                          <td className="p-2">
                            <select
                              className="border p-1 w-full break-words"
                              value={row.mobile}
                              onChange={(e) => handleMobileRelationChange(i, e.target.value)}
                              disabled={!isEditable}
                            >
                              <option value="">Select</option>
                              {contactList.map((c) => (
                                <option key={c.mobile} value={c.mobile}>
                                  {`${c.name} - ${c.mobile} (${c.relation})`}
                                </option>
                              ))}
                            </select>
                          </td>



                          <td className="p-2">
                            <input
                              type="date"
                              value={row.date}
                              className="border p-1"
                              onChange={(e)=>{
                                if(!validateDate(e.target.value)){
                                  alert('Date must be within +/- 48 hours');
                                  return;
                                }
                                updateRow(i,'date',e.target.value);
                              }}
                              disabled={!isEditable}
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="time"
                              value={row.time}
                              className="border p-1"
                              onChange={(e)=>updateRow(i,'time',e.target.value)}
                              disabled={!isEditable}
                            />
                          </td>

                          <td className="p-2">
                            <select
                              className="border"
                              value={row.numberCorrect}
                              onChange={(e)=>updateRow(i,'numberCorrect',e.target.value)}
                              disabled={!isEditable}
                            >
                              <option></option>
                              <option>Yes</option>
                              <option>No</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <select
                              className="border"
                              value={row.amountCorrect}
                              disabled={!isEditable || row.numberCorrect==='No'}
                              onChange={(e)=>updateRow(i,'amountCorrect',e.target.value)}
                            >
                              <option></option>
                              <option>Yes</option>
                              <option>No</option>
                              <option>Not Aware</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <select
                              className="border"
                              value={row.paidDateCorrect}
                              disabled={!isEditable || row.numberCorrect==='No'}
                              onChange={(e)=>updateRow(i,'paidDateCorrect',e.target.value)}
                            >
                              <option></option>
                              <option>Yes</option>
                              <option>No</option>
                              <option>Not Aware</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <textarea
                              className="border w-full"
                              value={row.remarks}
                              onChange={(e)=>updateRow(i,'remarks',e.target.value)}
                              disabled={!isEditable}
                            />
                          </td>

                          <td className="p-2">{row.timestamp || 'NA'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 text-sm">
                I hereby confirm that the above details have been verified with the customer during the call.
              </div>

              {/* branch/approver selectors - required before enabling submit */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Branch</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Approver</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                    disabled={!branch}
                  >
                    <option value="">Select approver</option>
                    {approversList.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className={`px-6 py-2 rounded-lg text-white ${hasUnsaved ? 'bg-blue-600' : 'bg-blue-300 opacity-50 cursor-not-allowed'}`}
                  onClick={handleSave}
                  disabled={!hasUnsaved}
                >
                  Save
                </button>
                <button
                  className={`px-6 py-2 rounded-lg text-white ${(!branch || !approver || hasUnsaved) ? 'bg-blue-300 opacity-50 cursor-not-allowed' : 'bg-blue-800'}`}
                  onClick={handleSubmitForApproval}
                  disabled={!branch || !approver || hasUnsaved}
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => {
                    if (hasUnsaved) {
                      // automatically persist before leaving
                      handleSave();
                    }
                    // clear selection when leaving details
                    setBranch("");
                    setApprover("");
                    setApproversList([]);
                    setMakerView("list");
                  }}
                  className="bg-gray-300 px-6 py-2 rounded-lg"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* =========================== APPROVER =========================== */}

      {role === "approver" && (
        <>
          {approverView === "list" && (
            <>
              <div className="bg-white rounded-2xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
                <select
                  className="border p-2 rounded"
                  value={approverFilters.maker}
                  onChange={(e) => setApproverFilters({ ...approverFilters, maker: e.target.value })}
                >
                  <option value="">All Makers</option>
                  {/* could dynamically populate maker names */}
                </select>
                <input
                  placeholder="Branch"
                  className="border p-2 rounded"
                  value={approverFilters.branch}
                  onChange={(e) => setApproverFilters({ ...approverFilters, branch: e.target.value })}
                />
                <select
                  className="border p-2 rounded"
                  value={approverFilters.status}
                  onChange={(e) => setApproverFilters({ ...approverFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option>Submitted</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
                <input
                  placeholder="Loan Number"
                  className="border p-2 rounded"
                  value={approverFilters.loan}
                  onChange={(e) => setApproverFilters({ ...approverFilters, loan: e.target.value })}
                />
                <button
                  className="bg-blue-600 text-white rounded-lg"
                  onClick={() => {}}
                >
                  Go
                </button>
                <button
                  className="bg-gray-200 rounded-lg"
                  onClick={() => setApproverFilters({ maker: "", branch: "", status: "", loan: "" })}
                >
                  Reset
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-auto">
                  <table className="table-fixed w-full text-sm whitespace-nowrap">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">Sr No</th>
                      <th className="p-3">Loan Number</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Maker Name</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Bucket</th>
                      <th className="p-3">EMI</th>
                      <th className="p-3">Total Dues</th>
                      <th className="p-3">Maker Saved Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Approver Time</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approverList.map((rec, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{i + 1}</td>
                        <td>{rec.loan}</td>
                        <td>{rec.customerName}</td>
                        <td>{rec.mobile}</td>
                        <td>{rec.userName}</td>
                        <td>{rec.branch || "-"}</td>
                        <td>{rec.bucket}</td>
                        <td>{rec.emi}</td>
                        <td>{rec.totalDues}</td>
                        <td>{rec.makerTime}</td>
                        <td>{statusBadge(rec.status)}</td>
                        <td>{rec.approverTime}</td>
                        <td>
                          <button
                            onClick={() => openReview(records.indexOf(rec))}
                            className="bg-blue-600 text-white px-4 py-1 rounded-lg"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {approverView === "review" && (
            <>
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="font-semibold mb-2">Account Details</h2>
                {currentIndex !== null && (
                  <div className="text-sm mb-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><b>Loan:</b> {records[currentIndex].loan}</div>
                    <div><b>Maker Time:</b> {records[currentIndex].makerTime}</div>
                    <div><b>Status:</b> {records[currentIndex].status}</div>
                    {records[currentIndex].status === "Rejected" && (
                      <div><b>Reject Remark:</b> {records[currentIndex].rejectRemark || "-"}</div>
                    )}
                    <div><b>Approver Time:</b> {records[currentIndex].approverTime}</div>
                    <div><b>Account Status:</b> Active</div>
                    <div><b>HL Number:</b> {records[currentIndex].loan}</div>
                    <div><b>Customer Name:</b> {records[currentIndex].userName}</div>
                    <div><b>EMI Amount:</b> 12000</div>
                    <div><b>Overdue Amount:</b> 35000</div>
                    <div><b>DPD:</b> 45</div>
                    <div><b>Last Paid Amount:</b> 10000</div>
                    <div><b>Date of Payment:</b> 10-Feb-2026</div>
                    <div><b>Customer Address:</b> Mumbai</div>
                    <div><b>Allocated ID:</b> AV45</div>
                    <div><b>Branch:</b> Andheri</div>
                    <div><b>State:</b> Maharashtra</div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="font-semibold mb-4">Maker Entry Details</h2>
                <table className="table-fixed w-full text-sm border whitespace-nowrap">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Number Correct</th>
                      <th className="p-3">Amount Correct</th>
                      <th className="p-3">Paid Date Correct</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3">Maker Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td>{row.customer}</td>
                        <td>{row.mobile}</td>
                        <td>{row.date}</td>
                        <td>{row.time}</td>
                        <td>{row.numberCorrect}</td>
                        <td>{row.amountCorrect}</td>
                        <td>{row.paidDateCorrect}</td>
                        <td>{row.remarks}</td>
                        <td>{row.timestamp || 'NA'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-sm"><b>Maker Name:</b> Raj Kumar</div>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold mb-4">Approver Action</h2>

                <textarea
                  placeholder="Rejection Remark (mandatory if reject)"
                  className="border w-full p-2 rounded mb-4"
                  value={rejectionRemark}
                  onChange={(e) => setRejectionRemark(e.target.value)}
                  disabled={approved}
                />

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={approveRecord}
                    disabled={approved || rejected}
                    className={`px-6 py-2 rounded-lg text-white ${approved || rejected ? 'bg-green-300 opacity-50 cursor-not-allowed' : 'bg-green-600'}`}
                  >Approve</button>

                  <button
                    onClick={rejectRecord}
                    disabled={approved || rejected}
                    className={`px-6 py-2 rounded-lg text-white ${approved || rejected ? 'bg-red-300 opacity-50 cursor-not-allowed' : 'bg-red-600'}`}
                  >Reject</button>
                </div>

                <div className="text-sm"><b>Approver Timestamp:</b> {approverTime || 'NA'}</div>
              </div>

              {(approved || rejected) && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 mt-6 text-sm">
                  Record locked. Status: {approved ? 'Approved' : 'Rejected'}
                </div>
              )}

              <button
                onClick={() => setApproverView("list")}
                className="mt-6 bg-gray-300 px-6 py-2 rounded-lg"
              >Back</button>
            </>
          )}
        </>
      )}
    </div>
  );
}