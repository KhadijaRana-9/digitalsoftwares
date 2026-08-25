import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute.jsx'
import PartnerLayout from './components/layout/PartnerLayout.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import CustomerLayout from './components/layout/CustomerLayout.jsx'

import Home from './pages/public/Home.jsx'
import Products from './pages/public/Products.jsx'
import Login from './pages/public/Login.jsx'
import Apply from './pages/public/Apply.jsx'
import ForgotPassword from './pages/public/ForgotPassword.jsx'
import ResetPassword from './pages/public/ResetPassword.jsx'
import NotFound from './pages/public/NotFound.jsx'

// Partner and admin dashboards pull in recharts + a lot of page code that the
// public marketing site (highest-traffic entry point) never needs — split
// them into their own chunks so a first-time visitor isn't downloading the
// full app shell just to read the landing page.
const PartnerDirectory = lazy(() => import('./pages/public/PartnerDirectory.jsx'))
const ProductDetail = lazy(() => import('./pages/public/ProductDetail.jsx'))

const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard.jsx'))
const CustomerSupport = lazy(() => import('./pages/customer/Support.jsx'))
const CustomerProfile = lazy(() => import('./pages/customer/Profile.jsx'))

const PartnerPending = lazy(() => import('./pages/partner/Pending.jsx'))
const PartnerDashboard = lazy(() => import('./pages/partner/Dashboard.jsx'))
const PartnerLeads = lazy(() => import('./pages/partner/Leads.jsx'))
const PartnerOpportunities = lazy(() => import('./pages/partner/Opportunities.jsx'))
const PartnerDeals = lazy(() => import('./pages/partner/Deals.jsx'))
const PartnerCustomers = lazy(() => import('./pages/partner/Customers.jsx'))
const PartnerProducts = lazy(() => import('./pages/partner/Products.jsx'))
const PartnerCommissions = lazy(() => import('./pages/partner/Commissions.jsx'))
const PartnerPayouts = lazy(() => import('./pages/partner/Payouts.jsx'))
const PartnerReferrals = lazy(() => import('./pages/partner/Referrals.jsx'))
const PartnerAssets = lazy(() => import('./pages/partner/Assets.jsx'))
const PartnerAcademy = lazy(() => import('./pages/partner/Academy.jsx'))
const PartnerCertifications = lazy(() => import('./pages/partner/Certifications.jsx'))
const PartnerSupport = lazy(() => import('./pages/partner/Support.jsx'))
const PartnerPerformance = lazy(() => import('./pages/partner/Performance.jsx'))
const PartnerProfile = lazy(() => import('./pages/partner/Profile.jsx'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminApplications = lazy(() => import('./pages/admin/Applications.jsx'))
const AdminPartners = lazy(() => import('./pages/admin/Partners.jsx'))
const AdminPartnerTiers = lazy(() => import('./pages/admin/PartnerTiers.jsx'))
const AdminDeals = lazy(() => import('./pages/admin/Deals.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'))
const AdminPricing = lazy(() => import('./pages/admin/Pricing.jsx'))
const AdminDiscountRequests = lazy(() => import('./pages/admin/DiscountRequests.jsx'))
const AdminCommissions = lazy(() => import('./pages/admin/Commissions.jsx'))
const AdminPayouts = lazy(() => import('./pages/admin/Payouts.jsx'))
const AdminMDF = lazy(() => import('./pages/admin/MDF.jsx'))
const AdminIncentives = lazy(() => import('./pages/admin/Incentives.jsx'))
const AdminAssets = lazy(() => import('./pages/admin/AssetsAdmin.jsx'))
const AdminAcademy = lazy(() => import('./pages/admin/Academy.jsx'))
const AdminTerritories = lazy(() => import('./pages/admin/Territories.jsx'))
const AdminRenewals = lazy(() => import('./pages/admin/Renewals.jsx'))
const AdminSupport = lazy(() => import('./pages/admin/Support.jsx'))
const AdminMarketplace = lazy(() => import('./pages/admin/Marketplace.jsx'))
const AdminCompliance = lazy(() => import('./pages/admin/Compliance.jsx'))
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'))
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'))
const AdminRolesPermissions = lazy(() => import('./pages/admin/RolesPermissions.jsx'))
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs.jsx'))

function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public marketing site */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/partners" element={<PartnerDirectory />} />

        {/* Guest-only auth pages */}
        <Route path="/apply" element={<GuestRoute><Apply /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Partner app */}
        <Route element={<ProtectedRoute role="partner" />}>
          <Route path="/partner/pending" element={<PartnerPending />} />
          <Route element={<PartnerLayout />}>
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/partner/leads" element={<PartnerLeads />} />
            <Route path="/partner/opportunities" element={<PartnerOpportunities />} />
            <Route path="/partner/deals" element={<PartnerDeals />} />
            <Route path="/partner/customers" element={<PartnerCustomers />} />
            <Route path="/partner/products" element={<PartnerProducts />} />
            <Route path="/partner/commissions" element={<PartnerCommissions />} />
            <Route path="/partner/payouts" element={<PartnerPayouts />} />
            <Route path="/partner/referrals" element={<PartnerReferrals />} />
            <Route path="/partner/assets" element={<PartnerAssets />} />
            <Route path="/partner/academy" element={<PartnerAcademy />} />
            <Route path="/partner/certifications" element={<PartnerCertifications />} />
            <Route path="/partner/support" element={<PartnerSupport />} />
            <Route path="/partner/performance" element={<PartnerPerformance />} />
            <Route path="/partner/profile" element={<PartnerProfile />} />
          </Route>
        </Route>

        {/* Customer portal */}
        <Route element={<ProtectedRoute role="customer" />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/support" element={<CustomerSupport />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Admin / Super Admin console — role="admin" covers both 'admin'
            and 'super_admin'; individual routes add a `permission` gate on
            top where the resource is staff-role-restricted, and System
            routes that must stay Super-Admin-only use "admins.manage",
            a permission never granted to any staff role (see seed.sql). */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />

            <Route element={<ProtectedRoute permission="partners.view" />}>
              <Route path="/admin/partners" element={<AdminPartners />} />
            </Route>
            <Route element={<ProtectedRoute permission="applications.review" />}>
              <Route path="/admin/applications" element={<AdminApplications />} />
            </Route>
            <Route element={<ProtectedRoute permission="tiers.manage" />}>
              <Route path="/admin/tiers" element={<AdminPartnerTiers />} />
            </Route>
            <Route element={<ProtectedRoute permission="territories.manage" />}>
              <Route path="/admin/territories" element={<AdminTerritories />} />
            </Route>

            <Route element={<ProtectedRoute permission="deals.approve" />}>
              <Route path="/admin/deals" element={<AdminDeals />} />
            </Route>
            <Route path="/admin/renewals" element={<AdminRenewals />} />

            <Route element={<ProtectedRoute permission="products.edit" />}>
              <Route path="/admin/products" element={<AdminProducts />} />
            </Route>
            <Route element={<ProtectedRoute permission="pricing.manage" />}>
              <Route path="/admin/pricing" element={<AdminPricing />} />
              <Route path="/admin/discounts" element={<AdminDiscountRequests />} />
            </Route>

            <Route element={<ProtectedRoute permission="commissions.approve" />}>
              <Route path="/admin/commissions" element={<AdminCommissions />} />
            </Route>
            <Route element={<ProtectedRoute permission="payouts.process" />}>
              <Route path="/admin/payouts" element={<AdminPayouts />} />
            </Route>
            <Route element={<ProtectedRoute permission="mdf.manage" />}>
              <Route path="/admin/mdf" element={<AdminMDF />} />
            </Route>
            <Route path="/admin/incentives" element={<AdminIncentives />} />

            <Route element={<ProtectedRoute permission="content.manage" />}>
              <Route path="/admin/assets" element={<AdminAssets />} />
            </Route>
            <Route element={<ProtectedRoute permission="training.manage" />}>
              <Route path="/admin/academy" element={<AdminAcademy />} />
            </Route>

            <Route element={<ProtectedRoute permission="support.manage" />}>
              <Route path="/admin/support" element={<AdminSupport />} />
            </Route>

            <Route element={<ProtectedRoute permission="marketplace.manage" />}>
              <Route path="/admin/marketplace" element={<AdminMarketplace />} />
            </Route>
            <Route element={<ProtectedRoute permission="compliance.manage" />}>
              <Route path="/admin/compliance" element={<AdminCompliance />} />
            </Route>

            <Route element={<ProtectedRoute permission="admins.manage" />}>
              <Route path="/admin/admin-users" element={<AdminUsers />} />
              <Route path="/admin/roles" element={<AdminRolesPermissions />} />
            </Route>
            <Route element={<ProtectedRoute permission="audit.view" />}>
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            </Route>
            <Route element={<ProtectedRoute permission="settings.manage" />}>
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
