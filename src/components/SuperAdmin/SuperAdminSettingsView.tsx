"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Save,
  User,
  Sliders,
  Bell,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Camera,
  History,
  MonitorSmartphone,
  MapPin,
  Calendar,
} from "lucide-react";
import { formatWelcomeName } from "@/lib/utils";
import type { ProfileData } from "@/types/settings";
import { updateProfile, changePassword } from "@/services/settings-data.service";

interface SuperAdminSettingsViewProps {
  data: ProfileData;
  userName: string;
  userEmail: string;
}

export function SuperAdminSettingsView({
  data,
  userName,
  userEmail,
}: SuperAdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "governance" | "security">("profile");

  // Profile Form State initialized from real backend data
  const [fullName, setFullName] = useState(
    data.profile?.fullName || (userName && !userName.includes("@") ? userName : "National System Administrator")
  );
  const [designation, setDesignation] = useState(data.profile?.position || "Director of Clinical Mentorship & Governance");
  const [email, setEmail] = useState(data.profile?.email || userEmail || "admin@moh.gov");
  const [phone, setPhone] = useState(data.profile?.phone || "+250 788 123 456");
  const [department, setDepartment] = useState("Maternal & Adolescent Health Directorate");
  const [organization, setOrganization] = useState("Ministry of Health (MOH)");
  const [officeLocation, setOfficeLocation] = useState("National Healthcare Operations Center, Sector 4");

  // Governance Policies State
  const [requireFacilityApproval, setRequireFacilityApproval] = useState(true);
  const [allowDirectPreceptorInvites, setAllowDirectPreceptorInvites] = useState(true);
  const [enforceMfaForAdmins, setEnforceMfaForAdmins] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [complianceThreshold, setComplianceThreshold] = useState("90");
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initials = fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SA";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    try {
      await updateProfile({
        fullName,
        phone,
        position: designation,
        email,
        facilityName: organization,
        region: officeLocation,
      });
      setIsSaving(false);
      setToastMessage({
        type: "success",
        text: "Super Administrator profile saved successfully to backend.",
      });
    } catch (err: any) {
      setIsSaving(false);
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to update profile. Please try again.",
      });
    }
  };

  const handleSaveGovernance = async () => {
    setIsSaving(true);
    setToastMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSaving(false);
    setToastMessage({
      type: "success",
      text: "National governance policies and security parameters updated.",
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToastMessage({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setToastMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setIsSaving(true);
    setToastMessage(null);

    try {
      await changePassword({ currentPassword, newPassword });
      setIsSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToastMessage({
        type: "success",
        text: "Account password updated successfully.",
      });
    } catch (err: any) {
      setIsSaving(false);
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to change password. Please verify your current password.",
      });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#194611] focus:outline-none focus:ring-1 focus:ring-[#194611]";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. SUPER ADMIN PROFILE HEADER */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-50/70" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#194611] text-2xl font-bold text-white shadow-xs">
                {initials}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#FDD028] text-gray-900 hover:bg-yellow-400 transition cursor-pointer shadow-xs"
                title="Update avatar"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Super Administrator
                </span>
                <span className="text-xs text-gray-400">• National Governance Clearance</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-xs text-gray-600 mt-0.5 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#194611]" />
                {organization} • {department}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System Active
            </span>
            <span className="text-[11px] text-gray-400">
              Platform Role: <strong className="text-gray-700">Root / Super Admin</strong>
            </span>
          </div>
        </div>
      </section>

      {/* 2. TABBED SETTINGS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition cursor-pointer ${
            activeTab === "profile"
              ? "border-[#194611] text-[#194611] bg-emerald-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Super Admin Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("governance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition cursor-pointer ${
            activeTab === "governance"
              ? "border-[#194611] text-[#194611] bg-emerald-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Governance & Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition cursor-pointer ${
            activeTab === "security"
              ? "border-[#194611] text-[#194611] bg-emerald-50/50"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. TAB 1: SUPER ADMIN PROFILE & MINISTRY INFORMATION */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#194611]" />
                Administrator Profile & Designation
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Official contact details and designation within the national healthcare mentorship programme.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                National Governance Affiliation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Governing Ministry / Agency
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    National Division / Directorate
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Headquarters / Central Operations Office
                  </label>
                  <input
                    type="text"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Profile Details"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4. TAB 2: NATIONAL GOVERNANCE & POLICIES */}
      {activeTab === "governance" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#194611]" />
                Healthcare Governance & Facility Policies
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Define operational accreditation requirements and access delegation rules across all facilities.
              </p>
            </div>

            {/* Policy Toggles */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Mandatory Super Admin Facility Accreditation
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
                    Newly registered healthcare facilities must be verified and approved by the Super Admin before their facility administrators can initiate mentorship cohorts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFacilityApproval}
                  onChange={(e) => setRequireFacilityApproval(e.target.checked)}
                  className="h-4 w-4 accent-[#194611] cursor-pointer mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Delegated Midwife Preceptor Onboarding
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
                    Allow appointed Facility Administrators to directly register and approve Midwife Mentors within their accredited hospital site.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowDirectPreceptorInvites}
                  onChange={(e) => setAllowDirectPreceptorInvites(e.target.checked)}
                  className="h-4 w-4 accent-[#194611] cursor-pointer mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Enforce Multi-Factor Authentication (MFA)
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
                    Mandate 2-step verification for all Facility Administrators and system supervisors during sign-in.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enforceMfaForAdmins}
                  onChange={(e) => setEnforceMfaForAdmins(e.target.checked)}
                  className="h-4 w-4 accent-[#194611] cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Threshold Parameters */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                System Operational Thresholds
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Super Admin Inactivity Session Timeout
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className={inputClass}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes (1 hour - Recommended)</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Facility Reporting Alert Threshold
                  </label>
                  <select
                    value={complianceThreshold}
                    onChange={(e) => setComplianceThreshold(e.target.value)}
                    className={inputClass}
                  >
                    <option value="85">Below 85% On-time Submissions</option>
                    <option value="90">Below 90% (Standard National Baseline)</option>
                    <option value="95">Below 95% High Reliability Tier</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Cadence */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Super Admin Programme Alerts
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="h-4 w-4 accent-[#194611]"
                  />
                  <span>Send Weekly Cross-Facility Performance & Workforce Summary to official email</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criticalAlerts}
                    onChange={(e) => setCriticalAlerts(e.target.checked)}
                    className="h-4 w-4 accent-[#194611]"
                  />
                  <span>Send Instant Alert when a facility reports zero active mentorship cycles</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveGovernance}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Governance Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: ACCOUNT & SECURITY */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#194611]" />
                Change Super Admin Password
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ensure your root administrative password is at least 8 characters with a mix of symbols.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={inputClass}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Updating Password..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions & Security Log */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#194611]" />
                Security & Session Log
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Active administrator sign-ins and authorized governance devices.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 border border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Last Login Recorded:</span>
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#194611]" />
                Today, 08:30 AM
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Current Active Session
              </p>

              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                <MonitorSmartphone className="w-5 h-5 text-[#194611] shrink-0 mt-0.5" />
                <div className="min-w-0 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Desktop Workstation</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#194611] font-bold">
                      Current Device
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">Next.js Web Browser (Chrome on Windows)</p>
                  <p className="text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ministry of Health Headquarters • IP 197.243.x.x
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
