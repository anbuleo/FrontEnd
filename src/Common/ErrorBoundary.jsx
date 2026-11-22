import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F1F5F4] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#D6E1DF] p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FDF0EF] text-[#B91C1C] flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="font-display text-2xl font-bold text-[#141918] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[#4A5452] mb-6">
              An unexpected error occurred while rendering this page. Please reload or return to
              the dashboard.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
