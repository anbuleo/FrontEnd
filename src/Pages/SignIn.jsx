import { useState } from 'react';
import logo from '../assets/skycommlogo1.png';
import { Formik } from 'formik';
import * as Yup from 'yup';
import UseSignInHook from '../Hooks/UseSignInHook.jsx';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const UserSchema = Yup.object().shape({
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

function SignIn() {
  const { loading, signIn } = UseSignInHook();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F1F5F4] text-[#141918]">
      {/* Architectural Pine Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#101E1D] text-[#F1F5F4] p-12 flex-col justify-between relative overflow-hidden border-r border-[#1F3331]">
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src={logo}
            alt="Sky Communications"
            className="w-11 h-11 rounded-xl object-contain bg-white p-1.5"
          />
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">
              Sky Communications
            </p>
            <p className="text-xs text-[#A3CBC6] font-medium">High-Speed Fiber Internet Services</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-white">
            Precision billing for every fiber subscriber.
          </h1>
          <p className="text-[#C7D5D3] text-sm leading-relaxed">
            Automated monthly cycles, sequential financial-year GST tax invoicing, field staff
            reconciliation, and real-time subscriber ledgers built for Sky Communications.
          </p>

          <ul className="space-y-3 pt-2 text-sm text-[#E4ECEA] border-t border-[#1F3331]">
            <li className="flex items-center gap-2.5 pt-2">
              <FiCheckCircle className="w-4 h-4 text-[#6CC7BE] shrink-0" />
              <span>Instant cash, UPI &amp; partial payment recording</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-[#6CC7BE] shrink-0" />
              <span>Zero double-counting monthly billing &amp; FY GST sequence</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-[#6CC7BE] shrink-0" />
              <span>Daily staff cash settlement &amp; GSTR-1 CA audit exports</span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#9AB3AF]">
          © {new Date().getFullYear()} Sky Communications, Dharapuram. Internal Operations Portal.
        </p>
      </div>

      {/* Sign in form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="flex flex-col items-center text-center mb-8 lg:hidden">
            <img
              src={logo}
              alt="Sky Communications"
              className="w-14 h-14 rounded-2xl object-contain bg-white border border-[#D6E1DF] p-2 mb-3"
            />
            <h1 className="font-display text-2xl font-bold text-[#141918]">Sky Communications</h1>
            <p className="text-xs text-[#4A5452]">Billing &amp; Collection Portal</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-7 sm:p-8">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-[#141918]">Sign in</h2>
              <p className="text-sm text-[#4A5452] mt-1">
                Enter your staff or administrator credentials to continue.
              </p>
            </div>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={UserSchema}
              onSubmit={(values) => signIn(values)}
            >
              {({ values, errors, touched, handleBlur, handleSubmit, handleChange }) => (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="block text-sm font-semibold text-[#2A3331] mb-1.5"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <FiMail className="w-4 h-4 text-[#596361] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="signin-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@skycomm.com"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#141918] placeholder:text-[#596361] focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition ${
                          errors.email && touched.email
                            ? 'border-[#C22B2B] focus:border-[#C22B2B]'
                            : 'border-[#C3D2CF] focus:border-brand-600'
                        }`}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="mt-1.5 text-xs text-[#B91C1C] font-medium">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signin-password"
                      className="block text-sm font-semibold text-[#2A3331] mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <FiLock className="w-4 h-4 text-[#596361] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white text-[#141918] placeholder:text-[#596361] focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition ${
                          errors.password && touched.password
                            ? 'border-[#C22B2B] focus:border-[#C22B2B]'
                            : 'border-[#C3D2CF] focus:border-brand-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5452] hover:text-[#141918] p-1 cursor-pointer"
                      >
                        {showPassword ? (
                          <FiEyeOff className="w-4 h-4" />
                        ) : (
                          <FiEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p className="mt-1.5 text-xs text-[#B91C1C] font-medium">{errors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <FiArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </Formik>

            <div className="mt-6 pt-5 border-t border-[#D6E1DF] text-center text-sm text-[#4A5452]">
              Need a staff account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
