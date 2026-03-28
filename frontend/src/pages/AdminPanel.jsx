import React, { useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../config";
import ConfirmModal from "../components/ConfirmModal";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, interns, broadcast, reports, certificates, projects
  const [analytics, setAnalytics] = useState({ totalUsers: 0, totalProjects: 0, paidUsers: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState({ ...confirmState, isOpen: false });
  };

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("All");
  const [filterDuration, setFilterDuration] = useState("All");
  const [filterDownloadStatus, setFilterDownloadStatus] = useState("New Only"); // New Only, Already Downloaded, All
  const [filterCompletionStatus, setFilterCompletionStatus] = useState("All"); // All, Ongoing, Completed
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All"); // All, Paid, Pending
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedBatches, setExpandedBatches] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkBatchDate, setBulkBatchDate] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [editingGrade, setEditingGrade] = useState({}); 
  const [adminNotes, setAdminNotes] = useState({});       
  const [emailModal, setEmailModal] = useState(null);     
  const [customEmailData, setCustomEmailData] = useState({ subject: '', body: '' });
  const [importResults, setImportResults] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [expandedCertId, setExpandedCertId] = useState(null);
  const [adminProjects, setAdminProjects] = useState([]);
  const [projectFormData, setProjectFormData] = useState({ domain: 'Frontend Development', monthNumber: 1, title: '', description: '', documentLink: '' });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);

  useEffect(() => {
    fetchAnalytics();
    fetchBroadcast();
  }, []);

  useEffect(() => {
    if (activeTab === "certificates") {
      fetchCertificates();
    }
    if (activeTab === "projects") {
      fetchAdminProjects();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const fetchBroadcast = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/broadcast/latest`);
      const result = await res.json();
      if (result.success) setActiveBroadcast(result.data);
    } catch (err) { console.error(err); }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      const result = await res.json();
      if (result.success) {
        setAnalytics(result.data.analytics);
        setUsers(result.data.users.reverse());
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/import-excel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        setImportResults(result.summary);
        toast.success(`Successfully imported ${result.summary.imported} interns! ${result.summary.skipped} duplicates skipped.`);
        fetchAnalytics(); // Refresh the list
      } else {
        toast.error(result.message || "Import failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during import.");
    } finally {
      setLoading(false);
      if (e.target) e.target.value = ""; // Clear input
    }
  };

  const handleImportVerifyDB = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/import-certificates`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server Error Response:", text);
        toast.error(`Server Error (${res.status}): ${text.slice(0, 100)}...`);
        return;
      }

      const result = await res.json();
      if (result.success) {
        toast.success(`Successfully updated Verification DB with ${result.summary.imported} certificates!`);
        fetchAnalytics();
        fetchCertificates(); // Also refresh the certificates list
      } else {
        toast.error(result.message || "Import failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Import Error: " + error.message);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = ""; // Clear input
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/certificates`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCertificates(result.data);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchAdminProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/admin-projects`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setAdminProjects(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateOrUpdateProject = async () => {
    if (!projectFormData.title || !projectFormData.description) return toast.error("Title and Description are required");
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingProjectId 
        ? `${API_BASE_URL}/api/admin/admin-projects/${editingProjectId}`
        : `${API_BASE_URL}/api/admin/admin-projects`;
      
      const res = await fetch(url, {
        method: editingProjectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(projectFormData)
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(editingProjectId ? "Project updated!" : "Project created!");
        setProjectFormData({ domain: 'Frontend Development', monthNumber: 1, title: '', description: '', documentLink: '' });
        setEditingProjectId(null);
        setIsProjectFormOpen(false);
        fetchAdminProjects();
      }
    } catch { toast.error("Error saving project template"); }
  };

  const handleDeleteAdminProject = async (id) => {
    requestConfirm(
      "Delete Template",
      "Are you sure you want to delete this project template?",
      async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${API_BASE_URL}/api/admin/admin-projects/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          const result = await res.json();
          if (result.success) {
            toast.success("Template deleted");
            fetchAdminProjects();
          }
        } catch { toast.error("Error deleting template"); }
      }
    );
  };

  const handleDeleteCertificate = async (id) => {
    requestConfirm(
      "Remove Certificate",
      "Are you sure you want to remove this record from the verification registry?",
      async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${API_BASE_URL}/api/admin/delete-certificate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ id })
          });
          const result = await res.json();
          if (result.success) {
            toast.success(result.message);
            fetchCertificates();
          }
        } catch (error) { console.error(error); }
      }
    );
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/broadcast/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: broadcastMessage })
      });
      if ((await res.json()).success) {
        setBroadcastMessage("");
        fetchBroadcast();
        toast.success("Broadcast sent!");
      } else {
        toast.error("Failed to send broadcast.");
      }
    } catch { toast.error("Error sending broadcast"); }
  };

  const handleClearBroadcast = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/broadcast/clear`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveBroadcast(null);
        toast.success("Broadcast cleared!");
      } else {
        toast.error("Failed to clear broadcast.");
      }
    } catch { toast.error("Error clearing broadcast"); }
  };

  const handleToggleOffer = async (email) => {
    requestConfirm(
      "Update Offer Status",
      "Are you sure you want to toggle the offer letter status?",
      async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${API_BASE_URL}/api/admin/offer-letter`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ email })
          });
          if ((await res.json()).success) {
            fetchAnalytics();
            toast.success("Offer letter status updated!");
          } else {
            toast.error("Failed to update offer letter status.");
          }
        } catch { toast.error("Error updating offer status"); }
      }
    );
  };

  const handleAssignBatch = async (email, batchDate) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/assign-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email, batch: batchDate })
      });
      if ((await res.json()).success) {
        fetchAnalytics();
        toast.success("Batch assigned!");
      } else {
        toast.error("Failed to assign batch.");
      }
    } catch { toast.error("Error assigning batch"); }
  };

  const handleBulkAssignBatch = async () => {
    if (selectedUsers.length === 0 || !bulkBatchDate) return;
    try {
      // Check if all selected users are downloaded
      const undownloaded = users.filter(u => selectedUsers.includes(u.email) && !u.isDownloaded);
      if (undownloaded.length > 0) {
        return toast.error(`${undownloaded.length} selected interns have not been downloaded yet. Please download Excel first.`);
      }

      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/assign-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ emails: selectedUsers, batch: bulkBatchDate })
      });
      if ((await res.json()).success) {
        setSelectedUsers([]);
        setBulkBatchDate("");
        fetchAnalytics();
        toast.success("Bulk batch assigned!");
      } else {
        toast.error("Failed to assign batch in bulk.");
      }
    } catch { toast.error("Error assigning batch in bulk"); }
  };

  const handleBulkTogglePayment = async (status) => {
    if (selectedUsers.length === 0) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-toggle-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ emails: selectedUsers, status })
      });
      if ((await res.json()).success) {
        setSelectedUsers([]);
        fetchAnalytics();
        toast.success("Bulk payment status updated!");
      } else {
        toast.error("Failed to update payment status in bulk.");
      }
    } catch { toast.error("Error updating payment status in bulk"); }
  };

  const handleBulkToggleOffer = async (sent) => {
    if (selectedUsers.length === 0) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-toggle-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ emails: selectedUsers, sent })
      });
      if ((await res.json()).success) {
        setSelectedUsers([]);
        fetchAnalytics();
        toast.success("Bulk offer status updated!");
      } else {
        toast.error("Failed to update offer status in bulk.");
      }
    } catch { toast.error("Error updating offer status in bulk"); }
  };

  const handleSendCertificate = async (email) => {
    requestConfirm(
      "Send Certificate",
      "Send Internship Certificate?",
      async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${API_BASE_URL}/api/admin/certificate`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message);
            fetchAnalytics();
          } else {
            toast.error(data.message);
          }
        } catch { toast.error("Error sending certificate"); }
      }
    );
  };

  const handleTogglePayment = async (email) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/toggle-payment`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      if ((await res.json()).success) {
        fetchAnalytics();
        toast.success("Payment status updated!");
      } else {
        toast.error("Failed to update payment status.");
      }
    } catch { toast.error("Error updating payment status"); }
  };

  const handleDeleteUser = async (email) => {
    requestConfirm(
      "Delete Student",
      "ARE YOU SURE? This will permanently delete the student registration.",
      async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem('adminToken');
          const res = await fetch(`${API_BASE_URL}/api/admin/delete-user`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.success) {
             fetchAnalytics();
             toast.success("User deleted successfully!");
          } else {
             toast.error(`Deletion failed: ${data.message}`);
          }
        } catch { toast.error("Network error: Deletion failed"); }
      }
    );
  };

  const handleSaveNote = async (email) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/save-note`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email, note: adminNotes[email] || '' })
      });
      if ((await res.json()).success) toast.success("Note Saved");
    } catch { toast.error("Error saving note"); }
  };

  const handleSendCustomEmail = async () => {
    if (!emailModal || !customEmailData.subject || !customEmailData.body) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/send-email`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: emailModal.email, ...customEmailData })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setEmailModal(null);
        setCustomEmailData({ subject: '', body: '' });
      } else {
        toast.error(data.message || "Failed to send custom email.");
      }
    } catch { toast.error("Error sending custom email"); }
  };

  const handleUpdateProjectStatus = async (projectId) => {
    const edit = editingGrade[projectId];
    if (!edit) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/update-project-status`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ projectId, ...edit })
      });
      if ((await res.json()).success) { toast.success("Project Updated!"); fetchAnalytics(); }
      else { toast.error("Failed to update project status."); }
    } catch { toast.error("Error updating project grade"); }
  };

  const handleMarkDownloaded = async (emails) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/api/admin/mark-downloaded`, {
        method: "POST", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ emails })
      });
      fetchAnalytics();
    } catch { console.error("Error marking as downloaded"); }
  };

  const exportToExcel = async () => {
    // Only target users that have NOT been downloaded yet
    const newUsers = filteredUsers.filter(u => !u.isDownloaded);

    if (newUsers.length === 0) {
      toast.error("No new registrations found."); return;
    }

    requestConfirm(
      "Export Data",
      `Download ${newUsers.length} new registrations? They will be marked as downloaded.`,
      async () => {
        closeConfirm();
        const formattedData = newUsers.map(user => ({
          "Student ID": user.studentId, "Full Name": user.fullName, "Email": user.email, "WhatsApp": user.whatsapp,
          "Course": user.course, "Branch": user.branch, "Year": user.currentYear, "College": user.collegeName,
          "State": user.state, "Domain": user.preferredDomain, "Duration": user.preferredDuration,
          "Payment": user.paymentStatus, "Applied Date": new Date(user.appliedAt).toLocaleDateString(),
        }));
        
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "New Registrations");
        XLSX.writeFile(wb, `Code-A-Nova_New_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);

        // Mark them as downloaded in DB
        const emails = newUsers.map(u => u.email);
        await handleMarkDownloaded(emails);
      }
    );
  };

  const filteredUsers = users.filter((user) => {
    // 1. Tab Filter
    // In "pending" tab (New Requests), only hide if ALREADY ASSIGNED. 
    // Being downloaded should NOT hide them from this tab if they aren't assigned.
    if (activeTab === "pending" && user.internshipStartDate !== "Unassigned") return false;
    
    // In "active" tab, only hide if UNASSIGNED.
    if (activeTab === "active" && user.internshipStartDate === "Unassigned") return false;

    // 2. Search Filter
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 3. Select Filters
    const matchesDomain = filterDomain === "All" || user.preferredDomain === filterDomain;
    const matchesDuration = filterDuration === "All" || user.preferredDuration === filterDuration;
    const matchesPayment = filterPaymentStatus === "All" || user.paymentStatus === filterPaymentStatus;
    
    // 4. Download Status (Pending tab only)
    let matchesDownload = true;
    if (activeTab === "pending") {
      // "New Only" should also include people who are downloaded but NOT YET ASSIGNED
      if (filterDownloadStatus === "New Only") matchesDownload = !user.isDownloaded || user.internshipStartDate === "Unassigned";
      else if (filterDownloadStatus === "Already Downloaded") matchesDownload = user.isDownloaded;
    }

    // 5. Completion Status (Active tab only)
    let matchesCompletion = true;
    if (activeTab === "active" && filterCompletionStatus !== "All") {
       const s = new Date(user.internshipStartDate);
       const dur = parseInt(user.preferredDuration) || 1;
       const e = new Date(s);
       e.setMonth(s.getMonth() + dur);
       const isComplete = new Date() >= e;
       if (filterCompletionStatus === "Completed") matchesCompletion = isComplete;
       if (filterCompletionStatus === "Ongoing") matchesCompletion = !isComplete;
    }

    return matchesSearch && matchesDomain && matchesDuration && matchesDownload && matchesPayment && matchesCompletion;
  });


  const uniqueDomains = ["All", ...new Set(users.map(u => u.preferredDomain))];
  const uniqueDurations = ["All", ...new Set(users.map(u => u.preferredDuration))];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-emerald-500">
      <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // ── SUB-COMPONENTS ──────────────────────────────────────────────────

  const SidebarItem = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${
        activeTab === id ? 'text-emerald-500 bg-emerald-500/5 border-r-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const StatCard = ({ label, val, color, icon }) => (
    <div className={`bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
        {icon}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-5xl font-black text-white">{val}</p>
    </div>
  );

  return (
    <div className="bg-zinc-950 min-h-screen flex text-white font-sans overflow-x-hidden">
      
      {/* ── MOBILE NAV BAR ─────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-900 z-50 flex items-center justify-between px-6">
        <h1 className="text-lg font-black tracking-tighter uppercase italic">C-A-N <span className="text-emerald-500">Admin</span></h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isSidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />}
          </svg>
        </button>
      </div>

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col fixed inset-y-0 z-[60] transition-transform duration-300 transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Code-A-Nova <span className="text-emerald-500">Admin</span></h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>
        <nav className="flex-1 mt-4">
          <SidebarItem id="dashboard" label="Dashboard" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          } />
          <SidebarItem id="pending" label="New Requests" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          } />
          <SidebarItem id="active" label="Active Interns" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          } />
          <SidebarItem id="broadcast" label="Broadcast" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          } />
          <SidebarItem id="reports" label="Reports" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          } />
          <SidebarItem id="certificates" label="Certifications" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          } />
          <SidebarItem id="projects" label="Projects" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          } />
        </nav>
        <div className="p-8 border-t border-zinc-900">
           <button onClick={handleLogout} className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-500 transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 p-6 md:p-12 pt-24 lg:pt-12 min-w-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
             <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.5em]">Central Command</span>
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mt-2">Redesign <span className="text-zinc-700">Panel.</span></h2>
          </div>
          <div className="flex gap-4">
             <button onClick={exportToExcel} className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-500 transition-all">Download XL</button>
             <button onClick={handleLogout} className="lg:hidden px-6 py-3 bg-red-600/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500">Logout</button>
          </div>
        </header>

        {/* ── DASHBOARD TAB ───────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Analytics Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Interns" val={analytics.totalUsers} color="text-blue-500" icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              } />
              <StatCard label="Submissions" val={analytics.totalProjects} color="text-emerald-500" icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              } />
              <StatCard label="Verified Paid" val={analytics.paidUsers} color="text-amber-500" icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              } />
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Recent Registrations</h3>
                  <div className="space-y-4">
                     {users.slice(0, 5).map(u => (
                        <div key={u._id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">{u.fullName[0]}</div>
                              <div>
                                 <p className="text-sm font-bold truncate max-w-[120px]">{u.fullName}</p>
                                 <p className="text-[10px] text-zinc-500 font-mono">{u.studentId || 'UNASSIGNED'}</p>
                              </div>
                           </div>
                           <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${u.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{u.paymentStatus}</span>
                        </div>
                     ))}
                  </div>
                  <button onClick={() => setActiveTab("pending")} className="w-full mt-6 py-3 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">View All Interns →</button>
               </div>

               <div className="bg-emerald-500 rounded-3xl p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-emerald-950">Active Broadcast</h3>
                    {activeBroadcast ? (
                      <div className="bg-emerald-950/10 p-5 rounded-2xl border border-emerald-600/20">
                        <p className="text-sm text-emerald-950 font-bold italic">"{activeBroadcast.message}"</p>
                        <p className="text-[10px] text-emerald-800 font-bold uppercase mt-4">Sent: {new Date(activeBroadcast.createdAt).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <p className="text-emerald-800 text-sm font-medium">No active global announcements. Use the Broadcast tool to reach all students.</p>
                    )}
                  </div>
                  <button onClick={() => setActiveTab("broadcast")} className="w-full mt-6 py-3 bg-emerald-950/10 border border-emerald-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-950 hover:bg-emerald-950/20 transition-all">Go to Broadcast Center →</button>
               </div>
            </div>
          </div>
        )}

        {/* ── INTERNS TAB ─────────────────────────────────────────────── */}
        {(activeTab === "pending" || activeTab === "active") && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header with Import Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
              <div>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">
                  {activeTab === "pending" ? "New Registrations" : "Intern Management"}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">
                  {activeTab === "pending" ? "Pending Approval" : "Active & Completed"} <span className="text-emerald-500">({filteredUsers.length})</span>
                </h3>
              </div>
              <div className="flex gap-3">
                <input 
                  type="file" ref={fileInputRef} onChange={handleImportExcel} 
                  accept=".xlsx,.xls,.csv" className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-500 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Import Excel
                </button>
              </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col lg:flex-row gap-4 items-center">
               <div className="flex-1 w-full relative">
                  <input 
                    type="text" placeholder="Search name, ID, or email..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <select 
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50"
                    value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
                  >
                    {uniqueDomains.map(d => <option key={d} value={d}>Track: {d}</option>)}
                  </select>
                  
                  {activeTab === "pending" ? (
                    <select 
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 text-emerald-500"
                      value={filterDownloadStatus} onChange={(e) => setFilterDownloadStatus(e.target.value)}
                    >
                      <option value="New Only">Registry: New Only</option>
                      <option value="Already Downloaded">Registry: Downloaded</option>
                      <option value="All">Registry: View All</option>
                    </select>
                  ) : (
                    <>
                      <select 
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 text-emerald-500"
                        value={filterCompletionStatus} onChange={(e) => setFilterCompletionStatus(e.target.value)}
                      >
                        <option value="All">Status: All Interns</option>
                        <option value="Ongoing">Status: Ongoing</option>
                        <option value="Completed">Status: Completed</option>
                      </select>
                      <select 
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50"
                        value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}
                      >
                        <option value="All">Fees: All</option>
                        <option value="Paid">Fees: Paid</option>
                        <option value="Pending">Fees: Unverified</option>
                      </select>
                    </>
                  )}
               </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedUsers.length > 0 && (
              <div className="bg-emerald-500 text-emerald-950 p-6 rounded-3xl sticky top-4 z-40 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-950 text-emerald-500 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <span className="text-xl font-black">{selectedUsers.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
                  </div>
                  <button onClick={() => setSelectedUsers([])} className="text-emerald-950/60 hover:text-emerald-950 transition-colors uppercase font-black text-[9px] underline underline-offset-4">Clear Selection</button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  {/* Batch Move */}
                  <div className="flex items-center gap-2 bg-emerald-600/20 p-2 rounded-2xl border border-emerald-700/30">
                    <input 
                      type="date" value={bulkBatchDate} onChange={(e) => setBulkBatchDate(e.target.value)}
                      className="bg-emerald-600/30 border border-emerald-700/50 rounded-xl px-4 py-2 text-xs font-bold text-emerald-950 focus:outline-none"
                    />
                    <button onClick={handleBulkAssignBatch} disabled={!bulkBatchDate} className="px-5 py-2.5 bg-emerald-950 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-950 transition-all disabled:opacity-50">Assign Batch</button>
                  </div>

                  {/* Payment Bulk */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleBulkTogglePayment('Paid')} className="px-5 py-2.5 bg-emerald-950/20 border-2 border-emerald-950/40 text-emerald-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-950/30 transition-all">Mark Paid</button>
                    <button onClick={() => handleBulkTogglePayment('Pending')} className="px-5 py-2.5 bg-emerald-950/20 border-2 border-emerald-950/40 text-emerald-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-950/30 transition-all">Mark Unpaid</button>
                  </div>

                  {/* Offer Bulk */}
                  <button onClick={() => handleBulkToggleOffer(true)} className="px-5 py-2.5 bg-emerald-950 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-950 transition-all">Mark Offer Sent</button>
                </div>
              </div>
            )}

            {/* Interns Nested List */}
            <div className="space-y-6">
              {(() => {
                // Helper: check if a user's internship is complete
                const isUserComplete = (user) => {
                  if (!user.internshipStartDate || user.internshipStartDate === 'Unassigned') return false;
                  const s = new Date(user.internshipStartDate);
                  if (isNaN(s.getTime())) return false;
                  const dur = parseInt(user.preferredDuration) || 1;
                  const e = new Date(s);
                  e.setMonth(s.getMonth() + dur);
                  return new Date() >= e;
                };

                // Group batch names
                const allBatchNames = [...new Set(filteredUsers.map(u => u.internshipStartDate || 'Unassigned'))].sort();
                const activeBatches = allBatchNames.filter(b => {
                  const bu = filteredUsers.filter(u => (u.internshipStartDate || 'Unassigned') === b);
                  return bu.some(u => !isUserComplete(u));
                });
                const completedBatches = allBatchNames.filter(b => {
                  const bu = filteredUsers.filter(u => (u.internshipStartDate || 'Unassigned') === b);
                  return bu.length > 0 && bu.every(u => isUserComplete(u));
                });

                const renderBatch = (batchName) => {
                  const batchUsers = filteredUsers.filter(u => (u.internshipStartDate || 'Unassigned') === batchName);
                  const isBatchExpanded = expandedBatches[batchName];

                return (
                  <div key={batchName} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <button 
                      onClick={() => setExpandedBatches({...expandedBatches, [batchName]: !isBatchExpanded})}
                      className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/50 transition-all text-left group"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isBatchExpanded ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          </div>
                          <div>
                             <h3 className="text-xl font-black uppercase tracking-tighter">{batchName}</h3>
                             <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">{batchUsers.length} Students</p>
                          </div>
                       </div>
                       <svg className={`w-5 h-5 text-zinc-700 group-hover:text-white transition-all ${isBatchExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isBatchExpanded && (
                      <div className="border-t border-zinc-800 p-4 space-y-4">
                        {/* Table Header */}
                        <div className="hidden lg:grid grid-cols-12 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 border-b border-zinc-800">
                           <div className="col-span-1 text-center"><input type="checkbox" onChange={() => {
                              const list = batchUsers.map(u => u.email);
                              const allSel = list.every(e => selectedUsers.includes(e));
                              if (allSel) setSelectedUsers(selectedUsers.filter(e => !list.includes(e)));
                              else setSelectedUsers([...new Set([...selectedUsers, ...list])]);
                           }} checked={batchUsers.length > 0 && batchUsers.every(u => selectedUsers.includes(u.email))} className="accent-emerald-500" /></div>
                           <div className="col-span-1"></div>
                           <div className="col-span-3">Student Identity</div>
                           <div className="col-span-2">Batch / Assign</div>
                           <div className="col-span-1 text-center">Projects</div>
                           <div className="col-span-2 text-center">Offer</div>
                           <div className="col-span-1 text-center">Cert</div>
                           <div className="col-span-1 text-center">Delete</div>
                        </div>

                        {/* User Rows */}
                        {batchUsers.map((user) => {
                          const maxP = parseInt(user.preferredDuration.split(" ")[0]) || 0;
                          const isDone = user.projectsCount >= maxP && maxP > 0;
                          const isExp = expandedUserId === user._id;

                          return (
                            <div key={user._id} className={`rounded-2xl border transition-all ${isExp ? 'border-zinc-700 bg-zinc-950 shadow-2xl' : 'border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-950/50'}`}>
                                 <div className="flex flex-col lg:grid lg:grid-cols-12 items-start lg:items-center px-6 py-6 text-xs font-bold transition-all relative gap-4 lg:gap-0">
                                   <div className="flex items-center justify-between w-full lg:contents">
                                       {/* Selection Checkbox */}
                                       <div className="lg:col-span-1 flex justify-center order-1 lg:order-none">
                                          <input 
                                            type="checkbox" checked={selectedUsers.includes(user.email)} 
                                            onChange={(e) => { e.stopPropagation(); setSelectedUsers(prev => prev.includes(user.email) ? prev.filter(e => e !== user.email) : [...prev, user.email]); }} 
                                            className="w-4 h-4 cursor-pointer accent-emerald-500 rounded border-zinc-800 bg-zinc-950 shrink-0"
                                          />
                                       </div>

                                       {/* Row Expander */}
                                       <div className="lg:col-span-1 flex justify-center order-3 lg:order-none">
                                          <button onClick={() => setExpandedUserId(isExp ? null : user._id)} className={`w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center transition-all ${isExp ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-white'}`}>
                                             <svg className={`w-4 h-4 transition-all ${isExp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                          </button>
                                       </div>

                                       {/* Name / ID */}
                                       <div className="lg:col-span-3 min-w-0 pr-2 order-2 lg:order-none flex-1 lg:flex-none ml-4 lg:ml-0 flex items-center gap-2">
                                          <div>
                                             <h4 className="text-sm font-black truncate text-white flex items-center gap-2">
                                                {user.fullName}
                                                {(() => {
                                                   const s = new Date(user.internshipStartDate);
                                                   const dur = parseInt(user.preferredDuration) || 1;
                                                   if (user.internshipStartDate !== "Unassigned" && !isNaN(s.getTime())) {
                                                      const e = new Date(s);
                                                      e.setMonth(s.getMonth() + dur);
                                                      if (new Date() >= e) return <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-[10px] shadow-lg shadow-emerald-500/20">✓</span>;
                                                   }
                                                   return null;
                                                })()}
                                             </h4>
                                             <p className="text-[10px] text-zinc-500 font-mono mt-1">{user.studentId || 'UNASSIGNED'}</p>
                                          </div>
                                       </div>
                                   </div>

                                   <div className="flex flex-wrap items-center gap-3 w-full lg:contents">
                                       {/* Batch Select (Mobile specific layout) */}
                                       <div className="lg:col-span-2 w-full lg:w-auto mt-2 lg:mt-0">
                                          <div className="lg:hidden text-[8px] text-zinc-600 uppercase mb-1">Batch Assignment</div>
                                          <input 
                                            type="date" value={user.internshipStartDate !== 'Unassigned' ? user.internshipStartDate : ''} 
                                            onChange={(e) => handleAssignBatch(user.email, e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 lg:py-1 text-[10px] font-bold text-zinc-500 uppercase focus:outline-none focus:border-emerald-500/50"
                                          />
                                       </div>

                                       <div className="flex flex-1 lg:contents justify-between items-center w-full">
                                          {/* Progress */}
                                          <div className="lg:col-span-1 flex flex-col items-center">
                                             <div className="lg:hidden text-[8px] text-zinc-600 uppercase mb-1">Progress</div>
                                             <span className={`text-[10px] font-black underline decoration-2 underline-offset-4 ${isDone ? 'text-emerald-500 decoration-emerald-500/30' : 'text-zinc-400 decoration-zinc-800'}`}>{user.projectsCount} / {maxP}</span>
                                          </div>

                                          {/* Offer Status */}
                                          <div className="lg:col-span-2 flex justify-center">
                                             <button onClick={() => handleToggleOffer(user.email)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                                user.offerLetterSent ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                                             }`}>
                                                {user.offerLetterSent ? '✓ Sent' : 'Mark Offer'}
                                             </button>
                                          </div>

                                          {/* Certificate Status */}
                                          <div className="flex justify-center transition-all lg:col-span-1">
                                             <button 
                                               disabled={!isDone} 
                                               onClick={() => handleSendCertificate(user.email)}
                                               className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                                  user.certificateSent ? 'bg-blue-500 text-white' : (!isDone ? 'bg-zinc-900 text-zinc-700 opacity-30 cursor-not-allowed' : 'bg-zinc-800 text-zinc-400 hover:bg-blue-500 hover:text-white')
                                               }`}
                                             >
                                                {user.certificateSent ? '✓ Issued' : (activeTab === 'pending' ? 'Cert' : 'Issue Cert')}
                                             </button>
                                          </div>
                                           <div className="lg:col-span-1 flex justify-center">
                                              <button onClick={() => handleDeleteUser(user.email)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                           </div>
                                       </div>
                                   </div>
                                </div>

                               {/* EXPANDED VIEW */}
                               {isExp && (
                                 <div className="p-8 pt-0 animate-in slide-in-from-top-4 duration-300">
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-800 mt-2 pt-8">
                                     {/* Personal Info Strip */}
                                     <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
                                        {[
                                          { l: "Email", v: user.email }, { l: "WhatsApp", v: user.whatsapp }, { l: "College", v: user.collegeName },
                                          { l: "Course/Branch", v: `${user.course} - ${user.branch}` }, { l: "Year", v: user.currentYear }, { l: "Status", v: user.paymentStatus },
                                          { l: "Internship Ends", v: (() => {
                                             if (!user.internshipStartDate || user.internshipStartDate === 'Unassigned') return 'TBD';
                                             const s = new Date(user.internshipStartDate);
                                             if (isNaN(s.getTime())) return 'TBD';
                                             const months = parseInt(user.preferredDuration) || 1;
                                             const e = new Date(s);
                                             e.setMonth(s.getMonth() + months);
                                             return e.toISOString().split('T')[0];
                                          })() },
                                        ].map(d => (
                                          <div key={d.l}>
                                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">{d.l}</p>
                                            <p className={`text-xs font-black truncate text-zinc-300`} title={d.v}>{d.v || '—'}</p>
                                          </div>
                                        ))}
                                        <div className="col-span-full pt-4">
                                           <button 
                                              onClick={() => handleTogglePayment(user.email)}
                                              className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                                                user.paymentStatus === 'Paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                                              }`}
                                           >
                                              {user.paymentStatus === 'Paid' ? '✓ Payment Verified — Click to Reset' : '❌ Unverified — Click to Force Pay'}
                                           </button>
                                        </div>
                                     </div>

                                     {/* Admin Actions */}
                                     <div className="space-y-5">
                                        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                            <p className="text-[9px] text-blue-400 font-black uppercase mb-3">Certification Identity</p>
                                            <div className="flex gap-2">
                                              <input 
                                                type="text" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500/50 uppercase font-mono"
                                                placeholder="Enter Cert ID (e.g. CAN-2024-001)" 
                                                defaultValue={user.certificateId || ''}
                                                id={`cert-id-${user.email}`}
                                              />
                                              <button 
                                                onClick={async () => {
                                                  const val = document.getElementById(`cert-id-${user.email}`).value;
                                                  try {
                                                    const res = await fetch(`${API_BASE_URL}/api/admin/update-user`, {
                                                      method: "POST",
                                                      headers: { 
                                                        "Content-Type": "application/json",
                                                        "Authorization": `Bearer ${localStorage.getItem('adminToken')}`
                                                      },
                                                      body: JSON.stringify({ email: user.email, certificateId: val })
                                                    });
                                                    const result = await res.json();
                                                    if (result.success) {
                                                      toast.success("Certificate ID updated!");
                                                      fetchAnalytics();
                                                    } else {
                                                      toast.error(result.message);
                                                    }
                                                  } catch (err) { console.error(err); }
                                                }}
                                                className="px-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                              >
                                                Save
                                              </button>
                                            </div>
                                         </div>
                                        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                           <p className="text-[9px] text-amber-500 font-black uppercase mb-3">Private Admin Note</p>
                                           <textarea 
                                             rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none"
                                             placeholder="..." value={adminNotes[user.email] !== undefined ? adminNotes[user.email] : (user.adminNote || '')}
                                             onChange={(e) => setAdminNotes({...adminNotes, [user.email]: e.target.value})}
                                           />
                                           <button onClick={() => handleSaveNote(user.email)} className="w-full mt-2 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-500 hover:text-zinc-950 transition-all">Update Note</button>
                                        </div>
                                        <button 
                                           onClick={() => { setEmailModal({ email: user.email, name: user.fullName }); setCustomEmailData({ subject: '', body: '' }); }}
                                           className="w-full py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white hover:border-emerald-500/30 transition-all"
                                        >
                                           Compose Custom Email →
                                        </button>
                                     </div>
                                   </div>

                                   {/* Project Grading Strip */}
                                   <div className="mt-8 pt-8 border-t border-zinc-800">
                                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-6">Submitted Work & Evaluation</p>
                                      {(user.projects || []).length === 0 ? (
                                        <p className="text-xs text-zinc-700 font-medium italic">No submissions yet.</p>
                                      ) : (
                                        <div className="space-y-4">
                                          {user.projects.map((proj) => (
                                            <div key={proj._id} className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-6 flex flex-col lg:flex-row gap-8">
                                               <div className="flex-1 space-y-4">
                                                  <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Project Month {proj.monthNumber || '?'}</span>
                                                    <span className="text-[9px] text-zinc-600 font-mono italic">{new Date(proj.submittedAt).toLocaleString()}</span>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {['task1', 'task2', 'task3'].map(k => proj[k]?.name && (
                                                       <div key={k} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                                                          <p className="text-[8px] text-zinc-600 font-bold uppercase mb-1">{k}</p>
                                                          <p className="text-xs font-black text-white truncate mb-2">{proj[k].name}</p>
                                                          <div className="flex gap-3">
                                                            <a href={proj[k].githubUrl} target="_blank" className="text-[9px] text-emerald-500 hover:underline">Code →</a>
                                                            {proj[k].liveUrl && <a href={proj[k].liveUrl} target="_blank" className="text-[9px] text-blue-500 hover:underline">Live →</a>}
                                                          </div>
                                                       </div>
                                                    ))}
                                                  </div>
                                               </div>
                                               <div className="lg:w-72 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
                                                  <div className="flex justify-between items-center">
                                                     <p className="text-[9px] text-zinc-600 font-black uppercase">Grading</p>
                                                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${proj.grade === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500 text-zinc-950'}`}>{proj.grade}</span>
                                                  </div>
                                                  <select 
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-zinc-500"
                                                    value={editingGrade[proj._id]?.grade || proj.grade}
                                                    onChange={(e) => setEditingGrade({...editingGrade, [proj._id]: {...(editingGrade[proj._id] || {feedback: proj.feedback}), grade: e.target.value}})}
                                                  >
                                                    {['Pending', 'A+', 'A', 'B', 'C'].map(g => <option key={g} value={g}>{g}</option>)}
                                                  </select>
                                                  <textarea 
                                                    className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-none"
                                                    placeholder="Mentor Feedback..."
                                                    value={editingGrade[proj._id]?.feedback || proj.feedback}
                                                    onChange={(e) => setEditingGrade({...editingGrade, [proj._id]: {...(editingGrade[proj._id] || {grade: proj.grade}), feedback: e.target.value}})}
                                                  />
                                                  <button onClick={() => handleUpdateProjectStatus(proj._id)} className="w-full py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 transition-all">Save Review</button>
                                               </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                   </div>
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
               };

               // Render sections
               if (activeTab !== 'active') {
                 return <>{allBatchNames.map(b => renderBatch(b))}</>;
               }
               if (filterCompletionStatus === 'Ongoing') return <>{activeBatches.map(b => renderBatch(b))}</>;
               if (filterCompletionStatus === 'Completed') return <>{completedBatches.map(b => renderBatch(b))}</>;

               // Default "All": active then completed with dividers
               return (
                 <>
                   {activeBatches.length > 0 && (
                     <div className="flex items-center gap-4">
                       <div className="h-px flex-1 bg-zinc-800" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-2">
                         Active Batches ({activeBatches.length})
                       </span>
                       <div className="h-px flex-1 bg-zinc-800" />
                     </div>
                   )}
                   {activeBatches.map(b => renderBatch(b))}
                   {completedBatches.length > 0 && (
                     <div className="flex items-center gap-4 mt-4">
                       <div className="h-px flex-1 bg-emerald-900/40" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 px-2">
                         Completed Batches ({completedBatches.length})
                       </span>
                       <div className="h-px flex-1 bg-emerald-900/40" />
                     </div>
                   )}
                   {completedBatches.map(b => renderBatch(b))}
                 </>
               );
              })()}
            </div>
          </div>
        )}

        {/* ── BROADCAST TAB ───────────────────────────────────────────── */}
        {activeTab === "broadcast" && (
          <div className="max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="bg-emerald-500 rounded-3xl p-10 text-emerald-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <svg className="w-40 h-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div className="relative z-10 space-y-6">
                   <h3 className="text-4xl font-black uppercase tracking-tighter">Global Broadcast</h3>
                   <p className="text-emerald-900 font-bold max-w-lg leading-relaxed italic">Send messages that instantly appear on ALL student dashboards. Perfect for deadlines, system updates, or batch announcements.</p>
                   <textarea 
                     className="w-full h-40 bg-emerald-950/10 border-2 border-emerald-950/20 rounded-3xl p-6 text-emerald-950 placeholder:text-emerald-800/50 font-bold focus:outline-none focus:border-emerald-950/40 transition-all resize-none shadow-inner"
                     placeholder="Type your message here..."
                     value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                   />
                   <div className="flex gap-4">
                      <button onClick={handleBroadcast} className="px-10 py-4 bg-emerald-950 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-950 transition-all shadow-2xl">Deploy Broadcast Now</button>
                      {activeBroadcast && (
                        <button onClick={handleClearBroadcast} className="px-10 py-4 bg-transparent border-2 border-emerald-950/20 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-950/10 transition-all">Destroy Active Banner</button>
                      )}
                   </div>
                </div>
             </div>

             {activeBroadcast && (
               <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">Live Monitoring</p>
                  <div className="flex items-center gap-4">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                     <p className="text-lg font-bold italic text-zinc-300">"{activeBroadcast.message}"</p>
                  </div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase mt-6">Timestamp: {new Date(activeBroadcast.createdAt).toLocaleString()}</p>
               </div>
             )}
          </div>
        )}

        {/* ── REPORTS TAB (MINIMAL) ───────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 max-w-2xl">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Export Headquarters</h3>
                <p className="text-zinc-500 text-sm mb-10 leading-relaxed">Download complete registration records including custom notes, payment status, and internship domains. Filters applied in the 'Interns' tab will reflect here.</p>
                <button onClick={exportToExcel} className="w-full py-5 bg-emerald-500 text-zinc-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:bg-emerald-400 transition-all">Download Master Registry (.xlsx) →</button>
             </div>
          </div>
        )}

        {/* ── CERTIFICATIONS TAB ───────────────────────────────────────── */}
        {activeTab === "certificates" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-zinc-900/50 border border-zinc-800 p-12 rounded-[3.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em]">Global Verification Registry</span>
                   </div>
                   <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Certifications <span className="text-zinc-700">&</span> Ledger</h2>
                   <p className="text-zinc-500 text-sm mt-4 max-w-md font-medium leading-relaxed">
                      Manage the single source of truth for all issued internship credentials. Upload new registry data or audit existing verified records.
                   </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                   <input 
                      type="file" ref={certFileInputRef} onChange={handleImportVerifyDB} 
                      accept=".xlsx,.xls,.csv" className="hidden" 
                   />
                   <button 
                      onClick={() => certFileInputRef.current?.click()}
                      className="group flex items-center gap-4 px-10 py-5 bg-emerald-500 text-zinc-950 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.15)]"
                   >
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Import Registry Data
                   </button>
                </div>
             </div>

             {/* Registry List / Table */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Verified Intern Records</h3>
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {certificates.length} Total Credentials Live
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-zinc-900/50 border-b border-zinc-800">
                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Intern</th>
                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Domain</th>
                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Certificate ID</th>
                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Status</th>
                            <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-zinc-600">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                         {certificates.map((cert) => (
                            <React.Fragment key={cert._id}>
                               <tr 
                                className={`hover:bg-zinc-800/30 transition-all cursor-pointer ${expandedCertId === cert._id ? 'bg-zinc-800/40' : ''}`} 
                                onClick={() => setExpandedCertId(expandedCertId === cert._id ? null : cert._id)}
                               >
                                  <td className="px-8 py-7">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-black text-zinc-500 uppercase">
                                           {cert.fullName.slice(0, 2)}
                                        </div>
                                        <div>
                                           <div className="text-sm font-black text-white uppercase tracking-tighter">{cert.fullName}</div>
                                           <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{cert.studentId}</div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-7">
                                     <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                        {cert.domain}
                                     </span>
                                  </td>
                                  <td className="px-8 py-7">
                                     <div className="text-[10px] font-mono font-black text-emerald-500 tracking-wider">
                                        {cert.certificateId}
                                     </div>
                                  </td>
                                  <td className="px-8 py-7">
                                     <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Verified</span>
                                     </div>
                                  </td>
                                  <td className="px-8 py-7">
                                     <div className="flex items-center gap-3">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteCertificate(cert._id); }}
                                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"
                                          title="Delete from Registry"
                                        >
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <div className={`transition-transform duration-300 ${expandedCertId === cert._id ? 'rotate-180' : ''}`}>
                                           <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                     </div>
                                  </td>
                               </tr>
                               {expandedCertId === cert._id && (
                                  <tr className="bg-zinc-950/50">
                                     <td colSpan="5" className="px-12 py-10">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 animate-in slide-in-from-top-2 duration-300">
                                           <div>
                                              <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Internal Email</p>
                                              <p className="text-xs font-bold text-zinc-300 lowercase">{cert.email}</p>
                                           </div>
                                           <div>
                                              <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Program Duration</p>
                                              <p className="text-xs font-bold text-zinc-300 uppercase">{cert.duration}</p>
                                           </div>
                                           <div>
                                              <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Internship Tenure</p>
                                              <p className="text-xs font-bold text-zinc-300 uppercase leading-none">{new Date(cert.startDate).toLocaleDateString('en-IN')} — {new Date(cert.endDate).toLocaleDateString('en-IN')}</p>
                                           </div>
                                           <div className="flex md:justify-end items-end">
                                              <div className="text-right">
                                                 <p className="text-[8px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Recorded On</p>
                                                 <p className="text-xs font-bold text-zinc-400 uppercase leading-none">{new Date(cert.createdAt).toLocaleString()}</p>
                                              </div>
                                           </div>
                                        </div>
                                     </td>
                                  </tr>
                               )}
                            </React.Fragment>
                         ))}
                         {certificates.length === 0 && (
                            <tr>
                               <td colSpan="5" className="px-8 py-20 text-center">
                                  <div className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No verified records found. Try importing the registry.</div>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Guidance */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                    { t: "Secure Access", d: "Data is only accessible via Student ID + Certificate ID two-factor match.", i: "🔒" },
                    { t: "Excel Priority", d: "Manual uploads here directly override existing registry status.", i: "📊" },
                    { t: "Recruiter Ready", d: "Propagates instantly to the public verification portal.", i: "🌎" }
                 ].map((item, idx) => (
                    <div key={idx} className="bg-zinc-900/40 border border-zinc-800/60 p-8 rounded-[2.5rem]">
                       <div className="text-3xl mb-4">{item.i}</div>
                       <h4 className="text-[10px] text-white font-black uppercase tracking-widest mb-2">{item.t}</h4>
                       <p className="text-zinc-500 text-xs leading-relaxed">{item.d}</p>
                    </div>
                 ))}
             </div>
          </div>
        )}
        {/* ── PROJECTS TAB ─────────────────────────────────────────────── */}
        {activeTab === "projects" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Curriculum Control</span>
                <h3 className="text-2xl font-black uppercase tracking-tighter mt-1">Project <span className="text-emerald-500">Templates</span></h3>
              </div>
              <button 
                onClick={() => {
                  setEditingProjectId(null);
                  setProjectFormData({ domain: 'Frontend Development', monthNumber: 1, title: '', description: '', documentLink: '' });
                  setIsProjectFormOpen(true);
                }}
                className="px-6 py-3 bg-emerald-500 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl"
              >
                + Create Template
              </button>
            </div>

            {/* Template Form Modal */}
            {isProjectFormOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
                <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative">
                  <button onClick={() => setIsProjectFormOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white uppercase font-black text-[10px]">Close X</button>
                  <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">{editingProjectId ? 'Edit' : 'New'} Project <span className="text-emerald-500">Template</span></h3>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Target Domain</label>
                      <select 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-emerald-500"
                        value={projectFormData.domain} onChange={(e) => setProjectFormData({...projectFormData, domain: e.target.value})}
                      >
                        <option value="Frontend Development">Frontend Development</option>
                        <option value="Backend Development">Backend Development</option>
                        <option value="MERN Stack Development">MERN Stack Development</option>
                        <option value="Full Stack Development">Full Stack Development</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Machine Learning">Machine Learning</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Python Development">Python Development</option>
                        <option value="C Programming">C Programming</option>
                        <option value="Figma or UI/UX">Figma or UI/UX</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Month Assignment</label>
                      <select 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-emerald-500"
                        value={projectFormData.monthNumber} onChange={(e) => setProjectFormData({...projectFormData, monthNumber: parseInt(e.target.value)})}
                      >
                        <option value={1}>Month 1 (Day 1)</option>
                        <option value={2}>Month 2 (Day 31)</option>
                        <option value={3}>Month 3 (Day 61)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Project Title</label>
                      <input 
                        type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. Modern E-Commerce UI"
                        value={projectFormData.title} onChange={(e) => setProjectFormData({...projectFormData, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Task Description</label>
                      <textarea 
                        rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                        placeholder="Briefly describe the project goals..."
                        value={projectFormData.description} onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Reference Document Link (Google Drive/Doc)</label>
                      <input 
                        type="url" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-xs font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="https://docs.google.com/..."
                        value={projectFormData.documentLink} onChange={(e) => setProjectFormData({...projectFormData, documentLink: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateOrUpdateProject}
                    className="w-full mt-10 py-5 bg-emerald-500 text-emerald-950 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-2xl"
                  >
                    {editingProjectId ? 'Update Template →' : 'Publish Template →'}
                  </button>
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminProjects.length === 0 ? (
                <div className="col-span-2 py-20 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem]">
                   <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No project templates defined yet. Start by creating one.</p>
                </div>
              ) : (
                adminProjects.map(proj => (
                  <div key={proj._id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] group relative overflow-hidden transition-all hover:border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => {
                          setEditingProjectId(proj._id);
                          setProjectFormData({
                            domain: proj.domain,
                            monthNumber: proj.monthNumber,
                            title: proj.title,
                            description: proj.description,
                            documentLink: proj.documentLink || ''
                          });
                          setIsProjectFormOpen(true);
                        }}
                        className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-emerald-950 transition-colors"
                       >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                       <button 
                        onClick={() => handleDeleteAdminProject(proj._id)}
                        className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
                       >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{proj.domain.split(' ')[0]}</div>
                      <div className="bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Month {proj.monthNumber}</div>
                    </div>

                    <h4 className="text-xl font-black text-white mb-3 group-hover:text-emerald-500 transition-colors">{proj.title}</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-6 line-clamp-3">{proj.description}</p>
                    
                    <div className="w-full pt-6 border-t border-zinc-800/50 mt-auto flex items-center justify-between">
                      {proj.documentLink ? (
                        <div className="flex gap-4">
                          <a href={proj.documentLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Briefing
                          </a>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(proj.documentLink);
                              toast.success("Link copied!");
                            }}
                            className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                          >
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                             Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-700 text-[9px] font-black uppercase tracking-widest italic">No Link Linked</span>
                      )}

                      <div className="flex gap-2">
                        {proj.documentLink && (
                          <a 
                            href={`https://wa.me/?text=${encodeURIComponent(`Hi! Here is your ${proj.domain} Month ${proj.monthNumber} Project Briefing: ${proj.documentLink}`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 transition-all"
                            title="Share on WhatsApp"
                          >
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── EMAIL MODAL ──────────────────────────────────────────────── */}
      {emailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setEmailModal(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors uppercase font-black text-[10px]">Close X</button>
            <div className="mb-10">
               <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.5em]">Branded Communication</span>
               <h3 className="text-3xl font-black text-white mt-2">Message to <span className="text-zinc-600">{emailModal.name.split(' ')[0]}</span></h3>
            </div>
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Subject Line</label>
                  <input 
                    type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. Action Required: Project Submission"
                    value={customEmailData.subject} onChange={(e) => setCustomEmailData({...customEmailData, subject: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Body Text</label>
                  <textarea 
                    rows={6} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                    placeholder="Dear intern..."
                    value={customEmailData.body} onChange={(e) => setCustomEmailData({...customEmailData, body: e.target.value})}
                  />
               </div>
               <button onClick={handleSendCustomEmail} className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] hover:bg-emerald-400 transition-all shadow-2xl">Send Professional Dispatch →</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default AdminPanel;
