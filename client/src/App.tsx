import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PatientLayout } from './components/PatientLayout';
import { SuperAdminLayout } from './components/SuperAdminLayout';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { hasFeature } from './utils/features';

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
const SubscriptionBilling = lazy(() => import('./pages/SubscriptionBilling').then((module) => ({ default: module.SubscriptionBilling })));

// Patient portal pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard').then((module) => ({ default: module.PatientDashboard })));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments').then((module) => ({ default: module.MyAppointments })));
const MyPrescriptions = lazy(() => import('./pages/patient/MyPrescriptions').then((module) => ({ default: module.MyPrescriptions })));
const MyRecords = lazy(() => import('./pages/patient/MyRecords').then((module) => ({ default: module.MyRecords })));
const MyVaccinations = lazy(() => import('./pages/patient/MyVaccinations').then((module) => ({ default: module.MyVaccinations })));
const MyPrivacy = lazy(() => import('./pages/patient/MyPrivacy').then((module) => ({ default: module.MyPrivacy })));
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

const FeatureGate = ({ feature, children }: { feature: string; children: React.ReactElement }) => {
  const { activeContext } = useAuth();
  if (activeContext?.type === 'hospital' && !hasFeature(activeContext.permissions, feature, activeContext.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
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
          <Route path="/hospitals/:country/:state/:city" element={<PublicHospitalSearch />} />
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
                    <Route path="/queue" element={<FeatureGate feature="queue"><OPDQueue /></FeatureGate>} />
                    <Route path="/prescriptions" element={<FeatureGate feature="prescriptions"><Prescriptions /></FeatureGate>} />
                    <Route path="/labs" element={<FeatureGate feature="labs"><LabOrders /></FeatureGate>} />
                    <Route path="/vitals" element={<FeatureGate feature="vitals"><Vitals /></FeatureGate>} />
                    <Route path="/discharges" element={<FeatureGate feature="discharges"><Discharges /></FeatureGate>} />
                    <Route path="/shifts" element={<FeatureGate feature="shifts"><ShiftSchedule /></FeatureGate>} />
                    <Route path="/claims" element={<FeatureGate feature="claims"><InsuranceClaims /></FeatureGate>} />
                    <Route path="/expenses" element={<FeatureGate feature="expenses"><Expenses /></FeatureGate>} />
                    <Route path="/rooms" element={<FeatureGate feature="rooms"><Rooms /></FeatureGate>} />
                    <Route path="/patients" element={<FeatureGate feature="patients"><Patients /></FeatureGate>} />
                    <Route path="/patients/:id" element={<FeatureGate feature="patients"><PatientDetail /></FeatureGate>} />
                    <Route path="/admissions" element={<FeatureGate feature="admissions"><Admissions /></FeatureGate>} />
                    <Route path="/doctors" element={<FeatureGate feature="doctors"><Doctors /></FeatureGate>} />
                    <Route path="/staff" element={<FeatureGate feature="staff"><Staff /></FeatureGate>} />
                    <Route path="/staff-types" element={<FeatureGate feature="staff_types"><StaffTypes /></FeatureGate>} />
                    <Route path="/inventory" element={<FeatureGate feature="inventory"><Inventory /></FeatureGate>} />
                    <Route path="/billing" element={<FeatureGate feature="billing"><Billing /></FeatureGate>} />
                    <Route path="/analytics" element={<FeatureGate feature="analytics"><Analytics /></FeatureGate>} />
                    <Route path="/simulator" element={<FeatureGate feature="simulator"><Simulator /></FeatureGate>} />
                    <Route path="/calendar" element={<FeatureGate feature="calendar"><CalendarSchedule /></FeatureGate>} />
                    <Route path="/notices" element={<FeatureGate feature="notices"><NoticeBoard /></FeatureGate>} />
                    <Route path="/leaves" element={<FeatureGate feature="leaves"><LeaveManagement /></FeatureGate>} />
                    <Route path="/groups" element={<FeatureGate feature="groups"><Groups /></FeatureGate>} />
                    <Route path="/feedback" element={<FeatureGate feature="feedback"><Feedback /></FeatureGate>} />
                    <Route path="/settings" element={<FeatureGate feature="settings"><Settings /></FeatureGate>} />
                    <Route path="/subscription" element={<SubscriptionBilling />} />
                    <Route path="/audit-logs" element={<FeatureGate feature="audit_logs"><AuditLogs /></FeatureGate>} />
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
                    <Route path="/vaccinations" element={<MyVaccinations />} />
                    <Route path="/privacy" element={<MyPrivacy />} />
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
