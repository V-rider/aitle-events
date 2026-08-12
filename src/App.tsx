import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { AdminEventDetail } from "@/pages/AdminEventDetail";
import { AdminEventForm } from "@/pages/AdminEventForm";
import { AdminEvents } from "@/pages/AdminEvents";
import { AdminLogin } from "@/pages/AdminLogin";
import { AdminSettings } from "@/pages/AdminSettings";
import { AdminUsers } from "@/pages/AdminUsers";
import { AttendanceLookup } from "@/pages/AttendanceLookup";
import { Certificate } from "@/pages/Certificate";
import { EventRegistration } from "@/pages/EventRegistration";
import { Home } from "@/pages/Home";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events/:slug" element={<EventRegistration />} />
      <Route path="/attendance-lookup" element={<AttendanceLookup />} />
      <Route path="/certificate/:id" element={<Certificate />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/events/create" element={<AdminEventForm />} />
        <Route path="/admin/events/:id/edit" element={<AdminEventForm />} />
        <Route path="/admin/events/:id" element={<AdminEventDetail />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
