// src/components/AssignTaskModal.jsx
import React, { useEffect, useState } from "react";
import { createTask } from "../api/taskApi";

export default function AssignTaskModal({ open, onClose, admin }) {
    const [frequency, setFrequency] = useState("Monthly");
    const [startDate, setStartDate] = useState(() => {
        // default to today's date in yyyy-mm-dd
        const d = new Date();
        return d.toISOString().slice(0, 10);
    });
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("Assigned task");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (admin) {
            setEmail(admin.email || "");
        }
    }, [admin]);

    useEffect(() => {
        if (!open) {
            // reset on close
            setFrequency("Monthly");
            setMessage("");
            setSubject("Assigned task");
            setError(null);
            const d = new Date();
            setStartDate(d.toISOString().slice(0, 10));
        }
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // validation
        if (!email) {
            setError("Email is required");
            return;
        }
        if (!startDate) {
            setError("Start date is required");
            return;
        }

        const payload = {
            adminId: admin?._id || admin?.id, // your admin id key
            email,
            frequency,
            startDate: new Date(startDate).toISOString(),
            message,
            subject,
        };

        setLoading(true);
        try {
            await createTask(payload);
            setLoading(false);
            onClose(true); // pass true to indicate success so parent can refresh
        } catch (err) {
            setLoading(false);
            console.error(err);
            setError(err?.response?.data?.message || err.message || "Failed to create task");
        }
    };

    return (
        <div className="assign-task-modal fixed inset-0 z-50 flex items-center justify-center">
            <div className="overlay absolute inset-0 bg-black opacity-50" onClick={() => onClose(false)} />
            <div className="modal-container relative bg-gray-900 text-white rounded-lg p-6 w-full max-w-lg z-10 shadow-lg">
                <h3 className="text-xl mb-3">Assign Task to {admin?.name || admin?.username || admin?.email}</h3>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm mb-1">Frequency</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800"
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="HalfYearly">Half-Yearly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Start date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800"
                        />
                        <small className="text-xs text-gray-400">
                            The scheduler will use this day-of-month as the recurrence day (if unavailable in a month, the last day of month is used).
                        </small>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Admin email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Subject</label>
                        <input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Message / Description</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="w-full p-2 rounded bg-gray-800"
                            placeholder="Write task description and details"
                        />
                    </div>

                    {error && <div className="text-sm text-red-400">{error}</div>}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
                        >
                            {loading ? "Saving..." : "Save & Schedule"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}