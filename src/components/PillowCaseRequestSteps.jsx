import { FaRegFileAlt, FaBoxOpen, FaRegEnvelope, FaRulerCombined, FaTags, FaPaperclip, FaCheckCircle } from "react-icons/fa";

const steps = [
  {
    title: "Choose Fabric",
    description: "Select up to two types—one for the front, one for the back.",
    icon: <FaTags className="text-pink-800 text-xl" />,
  },
  {
    title: "Choose Size & Quantity",
    description: "Choose the size and quantity of the pillow cases you want made with your fabric.",
    icon: <FaRulerCombined className="text-pink-800 text-xl" />,
  },
  {
    title: "Describe Fabric",
    description: "Share details like color, texture, or pattern to help us match your vision.",
    icon: <FaRegEnvelope className="text-pink-800 text-xl" />,
  },
  {
    title: "Bundle Fabric",
    description: "If using two types, tie or rubber-band them together to keep things organized.",
    icon: <FaPaperclip className="text-pink-800 text-xl" />,
  },
  {
    title: "Print & Attach Order",
    description: "Securely attach your printed order to the fabric or bundle so we can match it easily.",
    icon: <FaRegFileAlt className="text-pink-800 text-xl" />,
  },
  {
    title: "Choose Delivery Method",
    description: "Decide whether you'll mail or drop off your fabric.",
    icon: <FaBoxOpen className="text-pink-800 text-xl" />,
  },
  {
    title: "Press Submit Request",
    description: "Finalize your request with one click.",
    icon: <FaCheckCircle className="text-pink-800 text-xl" />,
  },
];

export default function PillowCaseRequestSteps() {
  return (
    <div className="bg-[#fdfaf6] p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        How to Submit a Custom Pillow Case Request
      </h2>
      <ul className="space-y-6">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-4">
            <div>{step.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-800">{index + 1}. {step.title}</h3>
              <p className="text-sm text-gray-700">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
