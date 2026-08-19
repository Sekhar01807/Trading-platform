import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div className='container p-5 my-5 text-center'>
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h1 className='display-4 fw-bold text-dark mb-3'>404</h1>
                    <h4 className='text-secondary mb-3'>Page Not Found</h4>
                    <p className='text-muted mb-4'>
                        Sorry, the page you are looking for does not exist or has been moved.
                    </p>
                    <Link to="/" className="btn btn-primary px-4 py-2" style={{ borderRadius: "8px", fontWeight: "600" }}>
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NotFound;
