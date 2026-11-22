import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../Components/Layout';
import CustomerTable from '../Components/SubComponents/CustomerTable';
import CreateCustomer from './CreateCustomer';
import Modal from '../Common/Modal';
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';
import UseReloadHook from '../Hooks/UseReloadHook';
import { formatCurrency } from '../Common/authUtils';
import { saveAs } from 'file-saver';
import {
  FiUserPlus,
  FiUpload,
  FiDownload,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
} from 'react-icons/fi';

function Customer() {
  const { customer = [] } = useSelector((state) => state.customer);
  const { customerReload } = UseReloadHook();
  const fileInputRef = useRef(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await AxiosService.get('/customer/upload-template', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'SkyComm_Customer_Upload_Format.xlsx');
      toast.success('Sample Excel format downloaded (includes live plan list)');
    } catch {
      toast.error('Failed to download template file');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const stats = useMemo(() => {
    const list = Array.isArray(customer) ? customer : [];
    const total = list.length;
    const dueCount = list.filter((c) => Number(c.remainingBalance) > 0).length;
    const totalDue = list.reduce((sum, c) => sum + Math.max(0, Number(c.remainingBalance) || 0), 0);
    const totalAdvance = list.reduce((sum, c) => sum + Math.max(0, Number(c.advanceAmount) || 0), 0);
    return { total, dueCount, totalDue, totalAdvance };
  }, [customer]);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const { data } = await AxiosService.post('/customer/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResponse(data);
      toast.success(data?.message || `${data.inserted} customer(s) added successfully.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await customerReload();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Bulk upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#4A5452]">Total Subscribers</p>
              <p className="text-2xl font-bold text-[#141918] tabular-nums">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#4A5452]">Accounts with Due</p>
              <p className="text-2xl font-bold text-[#141918] tabular-nums">{stats.dueCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#4A5452]">Total Pending Due</p>
              <p className="text-2xl font-bold text-rose-600 tabular-nums">
                {formatCurrency(stats.totalDue)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D6E1DF] p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#4A5452]">Total Advance Credit</p>
              <p className="text-2xl font-bold text-sky-700 tabular-nums">
                {formatCurrency(stats.totalAdvance)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#141918]">Subscriber Directory</h2>
            <p className="text-sm text-[#4A5452]">
              View, search, add, or bulk import broadband customers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setResponse(null);
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C3D2CF] bg-white hover:bg-[#F7FAFA] text-[#2A3331] text-sm font-semibold transition cursor-pointer"
            >
              <FiUpload className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition cursor-pointer"
            >
              <FiUserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Customer Directory Table */}
        <CustomerTable />

        {/* Add Customer Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Customer"
          subtitle="Register a new broadband subscriber and assign a monthly plan"
        >
          <CreateCustomer onClose={() => setIsCreateOpen(false)} />
        </Modal>

        {/* Bulk Excel Import Modal */}
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Bulk Import Customers (Excel)"
          subtitle="Upload an .xlsx or .xls spreadsheet to onboard multiple subscribers at once"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#D6E1DF] text-xs text-[#4A5452] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#1E2524]">Download Ready-to-Use Excel Template</p>
                <button
                  type="button"
                  disabled={downloadingTemplate}
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shrink-0"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>{downloadingTemplate ? 'Preparing...' : 'Download .xlsx Format'}</span>
                </button>
              </div>
              <p className="text-[#4A5452]">
                Includes sample regular &amp; GST customer rows plus a second sheet listing all
                valid Plan Names from your system.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full text-sm bg-white"
              />
            </div>

            {response && (
              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#D6E1DF] space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-lg font-bold text-emerald-700 tabular-nums">
                      {response.inserted || 0}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">Added</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-lg font-bold text-amber-700 tabular-nums">
                      {response.duplicates || 0}
                    </p>
                    <p className="text-xs text-amber-600 font-medium">Duplicates</p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <p className="text-lg font-bold text-rose-700 tabular-nums">
                      {(response.invalidPlans || 0) + (response.invalidRowsCount || 0)}
                    </p>
                    <p className="text-xs text-rose-600 font-medium">Skipped</p>
                  </div>
                </div>

                {response.invalidCustomers?.length > 0 && (
                  <div className="pt-2 text-xs text-rose-600">
                    <p className="font-semibold mb-1">Invalid Plan Names:</p>
                    <ul className="list-disc list-inside max-h-28 overflow-y-auto space-y-0.5">
                      {response.invalidCustomers.map((c, idx) => (
                        <li key={idx}>
                          {c.name} ({c.mobile}) — &quot;{c.planName || 'empty'}&quot;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECEB]">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#C3D2CF] text-sm font-medium text-[#2A3331] hover:bg-[#F7FAFA] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={uploading || !file}
                onClick={handleUpload}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                {uploading && <span className="loading loading-spinner loading-xs" />}
                <span>{uploading ? 'Uploading...' : 'Upload & Import'}</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

export default Customer;
