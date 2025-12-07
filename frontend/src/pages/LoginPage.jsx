import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async ({ username, password }) => {
        setError("");

        try {
            const res = await axios.post("http://localhost:4000/api/superAdmin/loginUser", {
                username,
                password,
            });

            const { role, user } = res.data;

            if (!role || !user?._id) {
                setError("Invalid server response");
                return;
            }

            // Save user
            if (role === "super-admin") {
                localStorage.setItem("superAdmin", JSON.stringify(user));
                localStorage.setItem("userType", "super-admin");
                navigate("/super-admin/dashboard");
            } else if (role === "admin") {
                localStorage.setItem("admin", JSON.stringify(user));
                localStorage.setItem("userType", "admin");
                navigate("/admin/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        }
    };

    return (
        <section className="bg-[var(--bg-primary)] w-screen h-screen py-8 flex flex-col gap-8 items-center">
            <img src="/fintel-color-logo-cropped.png" alt="Fintel Logo" className="w-60 md:w-80" />

            <div className="bg-[var(--bg-secondary)] w-full sm:w-[500px] border-2 rounded-xl p-5 flex flex-col gap-4">

                <h1 className="text-2xl font-bold text-center">Login to Dashboard</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

                    {/* Username */}
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            {...register("username", { required: "Username is required" })}
                            className="p-4 border rounded-lg w-full focus:ring-[var(--main-color)]"
                        />
                        {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <input
                            type="password"
                            placeholder="password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: { value: 8, message: "Minimum 8 characters required" },
                            })}
                            className="p-4 border rounded-lg w-full focus:ring-[var(--main-color)]"
                        />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="bg-[var(--main-color)] hover:bg-[var(--button-hover-color)] text-white p-4 rounded-lg font-bold"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center mt-4">
                    Go back to{" "}
                    <span
                        className="text-[var(--text-color-primary)] hover:underline cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        Home Page
                    </span>
                </p>
            </div>
        </section>
    );
};

export default LoginPage;