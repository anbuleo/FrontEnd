import React, { useState } from 'react'
import Layout from '../Components/Layout'
import CustomerTable from '../Components/SubComponents/CustomerTable'
import { AiOutlineUserAdd } from "react-icons/ai";
import CreateCustomer from './CreateCustomer';
import * as XLSX from "xlsx";
import AxiosService from '../Common/AxiosService';
import { toast } from 'react-toastify';


function Customer() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  // console.log(data)
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const { data } = await AxiosService.post("/customer/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResponse(data);
      toast.success(`${data.inserted} customers added successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };
  // const handleFileUpload = (event) => {
  //   const file = event.target.files[0]; // Get the uploaded file
  //   if (!file) return;

  //   const reader = new FileReader();

  //   reader.onload = (e) => {
  //     const binaryStr = e.target.result;
  //     const workbook = XLSX.read(binaryStr, { type: "binary" });

  //     // Assume the first sheet contains customer details
  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];

  //     // Convert sheet data to JSON
  //     const parsedData = XLSX.utils.sheet_to_json(sheet);

  //     console.log(parsedData); // Check extracted data
  //     setData(parsedData); // Store data in state
  //   };

  //   reader.readAsBinaryString(file);
  // };
  return (
    <>
      <Layout>
        <div className=" flex justify-between ">
          <div className="">
            <button
              className="btn btn-success"
              onClick={() => document.getElementById("my_modal_8").showModal()}
            >
             create Customer <AiOutlineUserAdd />
            </button>
            <dialog id="my_modal_8" className="modal ">
              <div className="modal-box  bg-gradient-to-br from-sky-600 to-fuchsia-600">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                {/* <h3 className="font-bold text-lg">Hello!</h3> */}
               <CreateCustomer />
              </div>
            </dialog>
          </div>
          <div className="flex">
          <input
         type="file" onChange={handleFileChange} accept=".xlsx"
          className="file-input file-input-primary"
        
        />
        <button className="btn btn-primary" onClick={handleUpload}  disabled={loading} > {loading ? "Uploading..." : "Upload Excel"}</button>
          </div>
        </div>
        <div className="">
        {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <p>✅ <b>{response.inserted}</b> customers added</p>
          <p>❌ <b>{response.duplicates}</b> duplicates found</p>
          <p>⚠️ <b>{response.invalidPlans}</b> invalid plans</p>

          {/* Show invalid customers */}
          {response.invalidCustomers?.length > 0 && (
            <div className="mt-3 text-red-600">
              <p>⚠️ Invalid Plan Names:</p>
              <ul className="list-disc list-inside">
                {response.invalidCustomers.map((c, index) => (
                  <li key={index}>{c.name} - {c.mobile}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
        </div>
        <div className="">
          <CustomerTable />
        </div>
      </Layout>
    </>
  );
}

export default Customer