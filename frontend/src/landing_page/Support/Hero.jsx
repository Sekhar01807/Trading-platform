import React from "react";


export default function SupportPortal() {
  return (
    <div className="support-bg py-5">
      <div className="container">

        {/* Header Row */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-semibold support-title m-0">
            Support Portal
          </h2>

          <button className="btn btn-primary" style={{ borderRadius: "6px", fontWeight: "600" }}>
            My tickets
          </button>
        </div>

        {/* Search Box */}
        <div className="position-relative">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder=" Eg: How do I open my account, How do i activate F&O..."
          />
        </div>
      </div>
    </div>
  );
}