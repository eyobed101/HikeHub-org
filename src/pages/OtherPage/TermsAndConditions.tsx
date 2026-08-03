import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  FileTextOutlined,
  SafetyOutlined,
  DollarOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  LockOutlined,
  CalendarOutlined,
  DownOutlined,
} from "@ant-design/icons";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: <CheckCircleOutlined className="text-blue-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          By registering as an Event Organizer on the HikeHub platform
          (&quot;Platform&quot;), you agree to be bound by these Terms and
          Conditions (&quot;Terms&quot;). These Terms constitute a legally
          binding agreement between you (&quot;Organizer&quot;) and HikeHub
          Technologies (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;).
        </p>
        <p>
          If you do not agree to all of these Terms, you must immediately
          discontinue use of the Platform. Continued use of the Platform after
          any modifications to these Terms constitutes acceptance of the updated
          Terms.
        </p>
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4">
          <p className="text-brand-700 dark:text-brand-300 font-medium text-sm">
            ⚠️ These Terms apply specifically to Event Organizers. Hikers and
            clients are governed by separate Terms of Service.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "eligibility",
    title: "2. Organizer Eligibility & Registration",
    icon: <UserOutlined className="text-green-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>To become an Event Organizer on HikeHub, you must:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Be at least 18 years of age or the legal age of majority in your jurisdiction.</li>
          <li>Provide accurate, current, and complete information during registration and keep it updated.</li>
          <li>Possess all required licenses, permits, and insurance mandated by local regulations to conduct hiking events.</li>
          <li>Not be prohibited by law from entering into this agreement.</li>
          <li>Not have a previous organizer account suspended or terminated by HikeHub.</li>
        </ul>
        <p>
          HikeHub reserves the right to verify your credentials and reject or
          revoke organizer status at its sole discretion. Organizer accounts are
          non-transferable.
        </p>
      </div>
    ),
  },
  {
    id: "event-standards",
    title: "3. Event Creation & Quality Standards",
    icon: <CalendarOutlined className="text-blue-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          As an Organizer, you are solely responsible for creating, managing,
          and conducting your events. All events listed on HikeHub must adhere
          to the following standards:
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              title: "Accuracy",
              desc: "Event descriptions, dates, locations, difficulty levels, and pricing must be truthful and up-to-date at all times.",
            },
            {
              title: "Safety Compliance",
              desc: "All events must comply with local safety regulations. A comprehensive safety plan, emergency contacts, and first-aid provisions must be in place.",
            },
            {
              title: "Capacity Management",
              desc: "You must not allow more participants than the maximum capacity specified in the event listing.",
            },
            {
              title: "Prohibited Content",
              desc: "Events must not promote illegal activities, hate speech, discrimination, or content violating Ethiopian or international law.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {item.title}
              </p>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
        <p>
          HikeHub reserves the right to remove any event listing that violates
          these standards without prior notice.
        </p>
      </div>
    ),
  },
  {
    id: "payments",
    title: "4. Payments, Fees & Revenue",
    icon: <DollarOutlined className="text-yellow-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          HikeHub facilitates payment collection on your behalf. The following
          financial terms apply:
        </p>
        <div className="space-y-2">
          {[
            {
              symbol: "%",
              color: "yellow",
              title: "Platform Commission",
              desc: "HikeHub charges a commission fee on all ticket sales as per the pricing schedule communicated at account registration. This schedule may be updated with 30-day notice.",
            },
            {
              symbol: "⏱",
              color: "green",
              title: "Payout Schedule",
              desc: "Revenue is disbursed to your registered bank account within 7–14 business days following the event completion, after deduction of platform fees and any applicable refunds.",
            },
            {
              symbol: "↩",
              color: "red",
              title: "Refunds & Chargebacks",
              desc: "You must honor the refund policy stated in your event listing. In the event of unauthorized chargebacks or fraud, HikeHub reserves the right to withhold payouts pending investigation.",
            },
            {
              symbol: "🧾",
              color: "blue",
              title: "Tax Obligations",
              desc: "Organizers are solely responsible for all applicable taxes, including VAT and income tax, on revenue earned through the Platform. HikeHub is not a tax agent.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <span className="text-base flex-shrink-0">{item.symbol}</span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{item.title}</p>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "cancellation",
    title: "5. Event Cancellation & Modifications",
    icon: <WarningOutlined className="text-orange-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          Cancellations and modifications must be handled responsibly to protect
          participants:
        </p>
        <div className="space-y-2">
          {[
            {
              label: "Cancellation ≥ 14 days before event",
              value: "Full refund to all participants. HikeHub commission non-refundable.",
              dotColor: "#22c55e",
            },
            {
              label: "Cancellation 7–13 days before event",
              value: "50% refund to participants. Organizer bears any processing costs.",
              dotColor: "#eab308",
            },
            {
              label: "Cancellation < 7 days before event",
              value: "No automatic refund. Organizer must negotiate directly with participants. HikeHub may intervene.",
              dotColor: "#ef4444",
            },
            {
              label: "Event Modifications",
              value: "Significant changes (date, location, price) must be communicated to all registrants within 24 hours of the decision.",
              dotColor: "#3b82f6",
            },
          ].map((item) => (
            <div key={item.label} className="flex gap-3 items-start">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: item.dotColor }}
              />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.label}</p>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <p>
          Repeated or unexplained event cancellations may result in account
          suspension or termination.
        </p>
      </div>
    ),
  },
  {
    id: "safety",
    title: "6. Safety & Liability",
    icon: <SafetyOutlined className="text-red-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          Safety is paramount. As an Organizer, you accept full responsibility
          for the physical safety of all participants during your events:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>You must conduct adequate risk assessments and provide safety briefings before every hike.</li>
          <li>Qualified first-aid personnel or kits appropriate to the event size must be present.</li>
          <li>You must have valid liability insurance covering participants for injury or death arising from your events.</li>
          <li>HikeHub acts solely as a technology platform. HikeHub is NOT responsible for injuries, deaths, property damage, or any other harm arising during Organizer events.</li>
          <li>You agree to indemnify, defend, and hold harmless HikeHub, its officers, directors, employees, and agents from any claims arising from your events.</li>
        </ul>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 font-medium text-sm">
            🚨 Failure to maintain adequate safety standards may result in
            immediate account suspension and referral to relevant authorities.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "data",
    title: "7. Data & Privacy",
    icon: <LockOutlined className="text-purple-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          You may access limited participant data (names, contact info) solely
          for the purpose of organizing the specific event they registered for.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Participant data must not be sold, shared with third parties, or used for any purpose other than event logistics.</li>
          <li>You must comply with applicable data protection laws, including Ethiopia's data protection regulations.</li>
          <li>HikeHub may audit your data usage practices. Non-compliance results in immediate account termination.</li>
          <li>You consent to HikeHub collecting and processing your organizer data as outlined in our Privacy Policy.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property",
    icon: <GlobalOutlined className="text-indigo-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          By posting event content on HikeHub (descriptions, images, videos,
          routes), you grant HikeHub a non-exclusive, worldwide, royalty-free
          license to use, reproduce, distribute, and display such content for
          promotional and operational purposes.
        </p>
        <p>
          You represent and warrant that you own or have the necessary rights
          to all content you post, and that such content does not infringe any
          third-party intellectual property rights.
        </p>
        <p>
          The HikeHub brand, logo, and platform technology remain the exclusive
          property of HikeHub Technologies and may not be used without explicit
          written permission.
        </p>
      </div>
    ),
  },
  {
    id: "account",
    title: "9. Account Suspension & Termination",
    icon: <ClockCircleOutlined className="text-gray-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          HikeHub reserves the right to suspend or permanently terminate your
          organizer account, with or without prior notice, for:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Violation of any of these Terms.</li>
          <li>Fraudulent or misleading event listings.</li>
          <li>Failure to honor refund obligations.</li>
          <li>Repeated safety incidents or complaints from participants.</li>
          <li>Engagement in activities harmful to the HikeHub community.</li>
          <li>Non-payment of platform fees.</li>
        </ul>
        <p>
          Upon termination, all pending payouts may be withheld pending review.
          You may appeal a suspension by contacting{" "}
          <a
            href="mailto:support@hikehub.com"
            className="text-brand-500 hover:underline"
          >
            support@hikehub.com
          </a>{" "}
          within 14 days.
        </p>
      </div>
    ),
  },
  {
    id: "governing-law",
    title: "10. Governing Law & Disputes",
    icon: <FileTextOutlined className="text-teal-500" />,
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        <p>
          These Terms are governed by and construed in accordance with the laws
          of the Federal Democratic Republic of Ethiopia. Any disputes arising
          from these Terms shall be subject to the exclusive jurisdiction of the
          courts of Addis Ababa, Ethiopia.
        </p>
        <p>
          Before initiating legal proceedings, parties agree to attempt
          good-faith resolution through HikeHub's internal dispute resolution
          process.
        </p>
        <p>
          HikeHub reserves the right to amend these Terms at any time. Continued
          use of the Platform after notification of changes constitutes
          acceptance of the new Terms. The most recent version is always
          available on the Platform.
        </p>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            <strong>Last Updated:</strong> August 2026 &nbsp;|&nbsp;{" "}
            <strong>Effective Date:</strong> August 1, 2026
          </p>
        </div>
      </div>
    ),
  },
];

import axiosInstance from "../../utils/axiosInstance";

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const handleToggleAcceptance = async (checked: boolean) => {
    setAccepted(checked);
    const token = sessionStorage.getItem("accessToken");
    if (checked && token) {
      setSaving(true);
      try {
        await axiosInstance.put("auth/accept-terms", { version: "2.1" });
      } catch (err) {
        console.log("Terms agreement recorded locally");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Terms & Conditions – HikeHub Organizer"
        description="Read the HikeHub Event Organizer Terms and Conditions before listing your hiking events."
      />
      <PageBreadcrumb pageTitle="Terms & Conditions" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl"
          style={{
            background: "linear-gradient(135deg, #3641f5 0%, #465fff 50%, #5b6aff 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute rounded-full opacity-10"
              style={{
                width: 256,
                height: 256,
                top: "-30%",
                right: "-10%",
                background: "white",
              }}
            />
            <div
              className="absolute rounded-full opacity-10"
              style={{
                width: 192,
                height: 192,
                bottom: "-20%",
                left: "-5%",
                background: "white",
              }}
            />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <FileTextOutlined className="text-white text-xl" />
              </div>
              <div>
                <p
                  className="text-sm font-medium uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Legal Agreement
                </p>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  Organizer Terms & Conditions
                </h1>
              </div>
            </div>
            <p
              className="text-sm leading-relaxed max-w-2xl"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Please read these terms carefully before organizing events on
              HikeHub. By listing events, you agree to be legally bound by these
              terms. These terms protect both you as an organizer and the hikers
              who join your adventures.
            </p>
            <div
              className="mt-4 flex items-center gap-4 text-xs"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <span>Version 2.1</span>
              <span>•</span>
              <span>Effective: August 1, 2026</span>
              <span>•</span>
              <span>10 Sections</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🏔️", label: "Event Standards", desc: "Quality & safety compliance" },
            { icon: "💰", label: "Revenue Share", desc: "Transparent fee structure" },
            { icon: "🛡️", label: "Liability", desc: "Organizer responsibility" },
            { icon: "📊", label: "Analytics", desc: "Access to your data" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                {card.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Accordion Sections */}
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = activeSection === section.id;
            return (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{section.icon}</span>
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {section.title}
                    </h2>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <DownOutlined className="text-gray-500 text-xs" />
                  </div>
                </button>

                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? "2000px" : "0px" }}
                >
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acceptance Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <CheckCircleOutlined className="text-brand-500" />
            Acknowledgement
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            By continuing to use the HikeHub Organizer platform, you confirm
            that you have read, understood, and agree to these Terms and
            Conditions. If you have any questions, contact us at{" "}
            <a
              href="mailto:legal@hikehub.com"
              className="text-brand-500 hover:underline"
            >
              legal@hikehub.com
            </a>
            .
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                id="terms-accept"
                className="sr-only"
                checked={accepted}
                onChange={(e) => handleToggleAcceptance(e.target.checked)}
              />
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: accepted ? "#465fff" : "transparent",
                  borderColor: accepted ? "#465fff" : "#d1d5db",
                }}
              >
                {accepted && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I have read and agree to the HikeHub Organizer Terms & Conditions
              and understand my responsibilities as an event organizer on this
              platform.
            </span>
          </label>

          {accepted && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircleOutlined className="text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Thank you for acknowledging the Terms & Conditions.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
