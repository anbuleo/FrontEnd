function Footer() {
  return (
    <footer className="border-t border-[#D6E1DF] bg-[#F7FAFA] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#4A5452]">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-[#141918]">Sky Communications</span> — Broadband
          Billing &amp; Collection Ledger.
        </p>
        <p className="text-[#596361]">Dharapuram • All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
