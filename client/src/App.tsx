import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PatientLayout } from './components/PatientLayout';
import { SuperAdminLayout } from './components/SuperAdminLayout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public pages
const Landing = lazy(() => import('./pages/Landing').then((module) => ({ default: module.Landing })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const RegisterHospital = lazy(() => import('./pages/RegisterHospital').then((module) => ({ default: module.RegisterHospital })));
const ForHospitals = lazy(() => import('./pages/ForHospitals').then((module) => ({ default: module.ForHospitals })));
const BookAppointment = lazy(() => import('./pages/BookAppointment').then((module) => ({ default: module.BookAppointment })));
const HospitalProfile = lazy(() => import('./pages/HospitalProfile').then((module) => ({ default: module.HospitalProfile })));
const PublicHospitalSearch = lazy(() => import('./pages/PublicHospitalSearch').then((module) => ({ default: module.PublicHospitalSearch })));

// Hospital dashboard pages
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Rooms = lazy(() => import('./pages/Rooms').then((module) => ({ default: module.Rooms })));
const Patients = lazy(() => import('./pages/Patients').then((module) => ({ default: module.Patients })));
const PatientDetail = lazy(() => import('./pages/PatientDetail').then((module) => ({ default: module.PatientDetail })));
const Admissions = lazy(() => import('./pages/Admissions').then((module) => ({ default: module.Admissions })));
const Doctors = lazy(() => import('./pages/Doctors').then((module) => ({ default: module.Doctors })));
const Inventory = lazy(() => import('./pages/Inventory').then((module) => ({ default: module.Inventory })));
const Billing = lazy(() => import('./pages/Billing').then((module) => ({ default: module.Billing })));
const Staff = lazy(() => import('./pages/Staff').then((module) => ({ default: module.Staff })));
const StaffTypes = lazy(() => import('./pages/StaffTypes').then((module) => ({ default: module.StaffTypes })));
const Analytics = lazy(() => import('./pages/Analytics').then((module) => ({ default: module.Analytics })));
const Simulator = lazy(() => import('./pages/Simulator').then((module) => ({ default: module.Simulator })));
const CalendarSchedule = lazy(() => import('./pages/CalendarSchedule').then((module) => ({ default: module.CalendarSchedule })));
const NoticeBoard = lazy(() => import('./pages/NoticeBoard').then((module) => ({ default: module.NoticeBoard })));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement').then((module) => ({ default: module.LeaveManagement })));
const Groups = lazy(() => import('./pages/Groups').then((module) => ({ default: module.Groups })));
const Prescriptions = lazy(() => import('./pages/Prescriptions').then((module) => ({ default: module.Prescriptions })));
const OPDQueue = lazy(() => import('./pages/OPDQueue').then((module) => ({ default: module.OPDQueue })));
const LabOrders = lazy(() => import('./pages/LabOrders').then((module) => ({ default: module.LabOrders })));
const Vitals = lazy(() => import('./pages/Vitals').then((module) => ({ default: module.Vitals })));
const Discharges = lazy(() => import('./pages/Discharges').then((module) => ({ default: module.Discharges })));
const ShiftSchedule = lazy(() => import('./pages/ShiftSchedule').then((module) => ({ default: module.ShiftSchedule })));
const InsuranceClaims = lazy(() => import('./pages/InsuranceClaims').then((module) => ({ default: module.InsuranceClaims })));
const Expenses = lazy(() => import('./pages/Expenses').then((module) => ({ default: module.Expenses })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((module) => ({ default: module.AuditLogs })));
const Feedback = lazy(() => import('./pages/Feedback').then((module) => ({ default: module.Feedback })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

// Patient portal pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard').then((module) => ({ default: module.PatientDashboard })));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments').then((module) => ({ default: module.MyAppointments })));
const MyPrescriptions = lazy(() => import('./pages/patient/MyPrescriptions').then((module) => ({ default: module.MyPrescriptions })));
const MyRecords = lazy(() => import('./pages/patient/MyRecords').then((module) => ({ default: module.MyRecords })));
const MyBills = lazy(() => import('./pages/patient/MyBills').then((module) => ({ default: module.MyBills })));
const FindHospitals = lazy(() => import('./pages/patient/FindHospitals').then((module) => ({ default: module.FindHospitals })));

// Super admin pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard').then((module) => ({ default: module.SuperAdminDashboard })));
const ManageHospitals = lazy(() => import('./pages/superadmin/ManageHospitals').then((module) => ({ default: module.ManageHospitals })));
const ManageUsers = lazy(() => import('./pages/superadmin/ManageUsers').then((module) => ({ default: module.ManageUsers })));
const ManageSubscriptions = lazy(() => import('./pages/superadmin/ManageSubscriptions').then((module) => ({ default: module.ManageSubscriptions })));
const UsageBilling = lazy(() => import('./pages/superadmin/UsageBilling').then((module) => ({ default: module.UsageBilling })));
const GlobalStaffTypes = lazy(() => import('./pages/superadmin/GlobalStaffTypes').then((module) => ({ default: module.GlobalStaffTypes })));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
    Loading...
  </div>
);

const PublicBookRedirect = () => {
  const { hospitalId } = useParams();
  return <Navigate to="/login" state={{ next: hospitalId ? `/patient/book/${hospitalId}` : '/patient/find' }} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/" element={<Landing />} />
          <Route path="/for-hospitals" element={<ForHospitals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-hospital" element={<RegisterHospital />} />
          <Route path="/hospitals" element={<PublicHospitalSearch />} />
          <Route path="/hospitals/:id" element={<HospitalProfile />} />
          <Route path="/book/:hospitalId" element={<PublicBookRedirect />} />

          {/* ========== HOSPITAL STAFF DASHBOARD ========== */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute requireContext="hospital">
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/queue" element={<OPDQueue />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route path="/labs" element={<LabOrders />} />
                    <Route path="/vitals" element={<Vitals />} />
                    <Route path="/discharges" element={<Discharges />} />
                    <Route path="/shifts" element={<ShiftSchedule />} />
                    <Route path="/claims" element={<InsuranceClaims />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/:id" element={<PatientDetail />} />
                    <Route path="/admissions" element={<Admissions />} />
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/staff-types" element={<StaffTypes />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/simulator" element={<Simulator />} />
                    <Route path="/calendar" element={<CalendarSchedule />} />
                    <Route path="/notices" element={<NoticeBoard />} />
                    <Route path="/leaves" element={<LeaveManagement />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ========== PATIENT PORTAL ========== */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute requireContext="patient">
                <PatientLayout>
                  <Routes>
                    <Route path="/" element={<PatientDashboard />} />
                    <Route path="/appointments" element={<MyAppointments />} />
                    <Route path="/prescriptions" element={<MyPrescriptions />} />
                    <Route path="/records" element={<MyRecords />} />
                    <Route path="/bills" element={<MyBills />} />
                    <Route path="/find" element={<FindHospitals />} />
                    <Route path="/book/:hospitalId" element={<BookAppointment />} />
                    <Route path="*" element={<Navigate to="/patient" replace />} />
                  </Routes>
                </PatientLayout>
              </ProtectedRoute>
            }
          />

          {/* ========== SUPER ADMIN PORTAL ========== */}
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute requireContext="superadmin">
                <SuperAdminLayout>
                  <Routes>
                    <Route path="/" element={<SuperAdminDashboard />} />
                    <Route path="/hospitals" element={<ManageHospitals />} />
                    <Route path="/users" element={<ManageUsers />} />
                    <Route path="/subscriptions" element={<ManageSubscriptions />} />
                    <Route path="/usage" element={<UsageBilling />} />
                    <Route path="/staff-types" element={<GlobalStaffTypes />} />
                    <Route path="*" element={<Navigate to="/super-admin" replace />} />
                  </Routes>
                </SuperAdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
