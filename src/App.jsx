import { useState, useEffect } from "react";
import pillowGuide from "./assets/pillow-guide.png";
import PillowCaseRequestSteps from "./components/PillowCaseRequestSteps";

export default function PillowForm() {
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState([{ size: "", quantity: 1 }]);
  const [sameFabric, setSameFabric] = useState(true);
  const [fabricResult, setFabricResult] = useState(null);
  const [enclosureType, setEnclosureType] = useState("");
  const [formID, setFormID] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [dropOffAddress, setDropOffAddress] = useState("");
  const [dropOffDateTime, setDropOffDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pickUpAddress: "",
    pickUpdateTime: ""
  });

  const generateReceipt = () => {
    const receiptWindow = window.open("", "Receipt", "width=600,height=800");
    const requestDetails = requests
      .map((r, i) => `<li>${r.quantity} × ${r.size}</li>`)
      .join("");

    const fabricDesc = sameFabric
      ? document.querySelector('[name="fabricDescription"]')?.value || "—"
      : `
      <p><strong>Front Fabric Description:</strong></p>
      <p>${
        document.querySelector('[name="frontFabricDescription"]')?.value || "—"
      }</p>
      <p><strong>Back Fabric Description:</strong></p>
      <p>${
        document.querySelector('[name="backFabricDescription"]')?.value || "—"
      }</p>
    `;

    const htmlContent = `
    <html>
      <head>
        <title>Pillow Request Receipt</title>
        <style>
          body { font-family: sans-serif; padding: 2em; }
          h2 { text-align: center; }
          p, li { margin: 0.5em 0; }
        </style>
      </head>
      <body>
        <h2> Custom Pillow Receipt</h2>
        <p><strong>Date:</strong> ${submissionDate}</p>
        <p><strong>Request ID:</strong> ${formID}</p>
        <p><strong>Enclosure Type:</strong> ${enclosureType}</p>
        <p><strong>Same Fabric Front & Back:</strong> ${
          sameFabric ? "Yes" : "No"
        }</p>
        ${fabricDesc}
        <p><strong>Pillow Sizes & Quantities:</strong></p>
        <ul>${requestDetails}</ul>
        <p><strong>Total Fabric Needed:</strong> ${
          fabricResult?.total || "—"
        } sq yards</p>
        ${
          !sameFabric
            ? `
          <p><strong>Front Fabric:</strong> ${
            fabricResult?.front || "—"
          } sq yards</p>
          <p><strong>Back Fabric:</strong> ${
            fabricResult?.back || "—"
          } sq yards</p>
        `
            : ""
        }
        <p><em>Please keep this receipt for your records.</em></p>
      </body>
    </html>
  `;

    receiptWindow.document.write(htmlContent);
    receiptWindow.document.close();
    receiptWindow.print(); // optional
  };

  const fabricPerSize = {
    "18x18": 324,
    "20x20": 400,
    "22x22": 484,
    "24x24": 576,
    "26x26": 676,
  };

  const resetForm = () => {
    setSubmitted(false);
    setLoading(false);
    setRequests([]);
    setSameFabric(true);
    setFabricResult({});
    setDropOffAddress("");
    setDropOffDateTime("");
    setDeliveryMethod("");
    setFormID(generateUniqueID());
    setSubmissionDate(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  };

  const generateUniqueID = (length = 5) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  useEffect(() => {
    calculateFabric();
  }, [requests, sameFabric]);

  useEffect(() => {
    setFormID(generateUniqueID());
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setSubmissionDate(formattedDate);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("contactInfo");
    if (saved) {
      setContactInfo(JSON.parse(saved));
      setDropOffAddress(contactInfo.address || "");
    }
  }, []);

  const calculateFabric = () => {
    let totalSqInches = 0;
    let largestArea = 0;

    requests.forEach(({ size, quantity }) => {
      const area = fabricPerSize[size];
      if (area) {
        totalSqInches += area * quantity;
        if (area > largestArea) largestArea = area;
      }
    });

    totalSqInches += largestArea;

    const front = sameFabric ? totalSqInches : totalSqInches / 2;
    const back = sameFabric ? 0 : totalSqInches / 2;
    const toYards = (sq) => (sq / (36 * 36)).toFixed(2);

    setFabricResult({
      front: toYards(front),
      back: toYards(back),
      total: toYards(totalSqInches),
    });
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...contactInfo, [name]: value };
    setContactInfo(updated);
    localStorage.setItem("contactInfo", JSON.stringify(updated));
  };

  const handleChange = (index, field, value) => {
    const updated = [...requests];
    updated[index][field] = value;
    setRequests(updated);
  };

  const addRequest = () => {
    setRequests([...requests, { size: "", quantity: 1 }]);
  };

  const removeRequest = (indexToRemove) => {
    setRequests(requests.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target;
    const formData = new FormData(form);

    formData.set("formID", formID);
    formData.set("submissionDate", submissionDate);
    formData.set("deliveryMethod", deliveryMethod);

    if (deliveryMethod === "DropOff") {
      formData.set("dropOffAddress", dropOffAddress);
      formData.set("dropOffDateTime", dropOffDateTime);
    }

    const payload = Object.fromEntries(formData.entries());

    try {
      await fetch("https://app.heysheet.in/api/s/nKdYajoJom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
    setSubmitted(true);

    setTimeout(() => {
      window.location.reload();
    }, 4000); // waits 4 seconds before refreshing
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Submitting...</h2>
        <p>Please wait while we send your request.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
        <p>
          Your custom pillow request has been submitted. We’ll be in touch soon.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          If you’re mailing fabric, please include your name and Request ID in
          the package.
        </p>
        <button
          type="button"
          onClick={() => window.history.reload()}
          className="mt-4 bg-gray-100 text-black py-2 rounded hover:bg-gray-200"
        >
          Start a New Request
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 p-6 bg-[#8C004A]  text-white">
        <h1 className="text-3xl font-bold text-[#8C004A] mb-2 text-center"></h1>
        <p className="text-lg leading-relaxed text-center">
          We’re so glad you’re
          here. This is our custom pillow case request form.  Follow the steps below.
        </p>
      </div>

      <div className="md:flex md:flex-rows md:h-screen">
        <img
          src={pillowGuide}
          alt="Custom pillow"
          className="md:w-2/5 w-full"
        />

        <div className="flex-grow min-h-0 flex flex-col ">
          <form
            onSubmit={handleSubmit}
            action="https://app.heysheet.in/api/s/nKdYajoJom"
            method="POST"
            className=" p-6 rounded shadow-md"
          >
            {/* Name */}

            <div className="flex items-center my-8 ">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500">
                Shipping Details
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 ">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Name or Business Name
                </label>
                <input
                  value={contactInfo.name}
                  onChange={handleContactChange}
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Your full name or "
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  value={contactInfo.email}
                  onChange={handleContactChange}
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  value={contactInfo.phone}
                  onChange={handleContactChange}
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Enclosure Type
                </span>
              </div>
            </div>

            {/* Enclosure Type */}

            <div className="mb-6">
              <label
                htmlFor="enclosureType"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Choose your enclosure type
              </label>
              <select
                name="enclosureType"
                id="enclosureType"
                value={enclosureType}
                onChange={(e) => setEnclosureType(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="">Select an option</option>
                <option value="Zipper">Zipper</option>
                <option value="Invisible Zipper">Invisible Zipper</option>
                <option value="Envelope">Envelope (no zipper)</option>
              </select>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Select Pillow Sizes & Quantities
                </span>
              </div>
            </div>

            {/* Pillow Sizes & Quantities */}
            {/* Add calculation function for envelope fold the back fabric gets 6 extra inches */}

            {requests.map((r, i) => (
              <div
                key={i}
                className="mb-6 p-4 rounded-lg border border-gray-200 shadow-sm space-y-4 bg-white"
              >
                {/* Size Dropdown */}
                <div>
                  <label
                    htmlFor={`size_${i}`}
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Pillow Size
                  </label>
                  <select
                    name={`size_${i}`}
                    id={`size_${i}`}
                    value={r.size}
                    onChange={(e) => handleChange(i, "size", e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  >
                    <option value="">Select size</option>
                    {Object.keys(fabricPerSize).map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label
                    htmlFor={`quantity_${i}`}
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    name={`quantity_${i}`}
                    id={`quantity_${i}`}
                    value={r.quantity}
                    onChange={(e) =>
                      handleChange(i, "quantity", e.target.value)
                    }
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  {" "}
                  <button
                    type="button"
                    onClick={() => removeRequest(i)}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove This Size
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRequest}
              className="inline-block bg-[#EFD8DE] text-[#8C004A] font-medium px-4 py-2 rounded-md shadow-sm hover:bg-[#E4C2CC] transition"
              type="text"
              style={{ outline: "none" }}
            >
              + Add Another Size
            </button>

            {/* Fabric Layout */}
            <div className="mb-6">
              <label
                htmlFor="sameFabric"
                className="block text-sm font-semibold text-gray-700 mb-2 mt-5"
              >
                Use same fabric for front and back?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name="sameFabric"
                    checked={sameFabric}
                    onChange={() => setSameFabric(true)}
                    className="accent-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name="sameFabric"
                    checked={!sameFabric}
                    onChange={() => setSameFabric(false)}
                    className="accent-indigo-500 focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Fabric Calculator */}

            {fabricResult && (
              <div className="mt-6 bg-[#EFD8DE] rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-[#8C004A]">
                    Total Fabric Needed:
                  </span>{" "}
                  {fabricResult.total} sq yards
                </p>

                {!sameFabric && (
                  <div className="mt-2 space-y-1 text-sm text-gray-800">
                    <p>
                      <span className="font-semibold text-[#8C004A]">
                        Front Fabric:
                      </span>{" "}
                      {fabricResult.front} sq yards
                    </p>
                    <p>
                      <span className="font-semibold text-[#8C004A]">
                        Back Fabric:
                      </span>{" "}
                      {fabricResult.back} sq yards
                    </p>
                  </div>
                )}

                <input
                  type="hidden"
                  name="calculatedFabricYardage"
                  value={fabricResult.total}
                />
              </div>
            )}

            {/* Conditional Fabric Description */}
            {!sameFabric ? (
              <>
                {/* Front Fabric Description */}
                <div className="mb-6">
                  <label
                    htmlFor="frontFabricDescription"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Describe front fabric
                  </label>
                  <textarea
                    name="frontFabricDescription"
                    id="frontFabricDescription"
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    placeholder="Color, texture, pattern..."
                  />
                </div>

                {/* Back Fabric Description */}
                <div className="mb-6">
                  <label
                    htmlFor="backFabricDescription"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Describe back fabric
                  </label>
                  <textarea
                    name="backFabricDescription"
                    id="backFabricDescription"
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    placeholder="Color, texture, pattern..."
                  />
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label
                  htmlFor="fabricDescription"
                  className="block text-sm font-semibold text-gray-700 mb-1 mt-5"
                >
                  Describe your fabric
                </label>
                <textarea
                  name="fabricDescription"
                  id="fabricDescription"
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Color, texture, pattern..."
                />
              </div>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Your Request ID
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="form-id"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Your Request ID
              </label>
              <input
                type="text"
                id="form-id"
                name="formID"
                value={formID}
                readOnly
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#EFD8DE] text-[#8C004A] cursor-not-allowed focus:outline-none"
              />
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Generate Your Receipt
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={generateReceipt}
              className="w-full bg-[#8C004A] text-white font-medium py-2 rounded-md shadow-sm hover:bg-[#73003D] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              Generate Receipt
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  How will you get your fabric to us?
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="deliveryMethod"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                How will you get your fabric to us?
              </label>
              <select
                name="deliveryMethod"
                id="deliveryMethod"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="">Select an option</option>
                <option value="Mail">Mail to us </option>
                <option value="DropOff">Have us pick it up</option>
              </select>

              {/* Mail Option */}
              {deliveryMethod === "Mail" && (
                <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-indigo-700">
                      Mailing Address:
                    </span>
                  </p>
                  <p className="text-sm text-gray-800 mt-1">
                  
                    <br />
       
                    <br />
       
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                   
                  </p>
                </div>
              )}

              {/* Drop-Off Option */}
              {deliveryMethod === "DropOff" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="pickUpAddress"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Pick-up Address
                    </label>
                    <input
                      type="text"
                      name="pickUpAddress"
                      id="pickUpAddress"
                      value={contactInfo.pickUpAddress}
                      onChange={handleContactChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      placeholder="Enter pick-up location"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dropOffDateTime"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      Preferred Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="pickUpDateTime"
                      id="pickUpDateTime"
                      value={contactInfo.pickUpDateTime}
                      onChange={handleContactChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Submit Your Custom Request
                </span>
              </div>
            </div>

            {/* Submit */}
            <input type="hidden" name="submissionDate" value={submissionDate} />
            <input type="hidden" name="submissionDate" value={submissionDate} />

            <button
              type="submit"
              className="w-full bg-[#8C004A] text-white font-medium py-2 rounded-md shadow-sm hover:bg-[#73003D] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              Submit Request
            </button>
          </form>

          <div
            id="receipt-content"
            style={{ display: "none" }}
            className="max-w-xl mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-indigo-700 border-b pb-2">
              Custom Pillow Receipt
            </h2>

            <div className="text-sm text-gray-800 space-y-2">
              <p>
                <span className="font-semibold">Request ID:</span> {formID}
              </p>
              <p>
                <span className="font-semibold">Enclosure Type:</span>{" "}
                {enclosureType}
              </p>
              <p>
                <span className="font-semibold">Same Fabric Front & Back:</span>{" "}
                {sameFabric ? "Yes" : "No"}
              </p>

              <div>
                <p className="font-semibold">Fabric Description:</p>
                <p className="mt-1">
                  {sameFabric
                    ? document.querySelector('[name="fabricDescription"]')
                        ?.value || "—"
                    : `${
                        document.querySelector(
                          '[name="frontFabricDescription"]'
                        )?.value || "—"
                      } (Front), ${
                        document.querySelector('[name="backFabricDescription"]')
                          ?.value || "—"
                      } (Back)`}
                </p>
              </div>

              <div>
                <p className="font-semibold">Pillow Sizes & Quantities:</p>
                <ul className="list-disc list-inside mt-1">
                  {requests.map((r, i) => (
                    <li key={i}>
                      {r.quantity} × {r.size}
                    </li>
                  ))}
                </ul>
              </div>

              <p>
                <span className="font-semibold">Total Fabric Needed:</span>{" "}
                {fabricResult?.total || "—"} sq yards
              </p>

              {!sameFabric && (
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">Front Fabric:</span>{" "}
                    {fabricResult?.front || "—"} sq yards
                  </p>
                  <p>
                    <span className="font-semibold">Back Fabric:</span>{" "}
                    {fabricResult?.back || "—"} sq yards
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
