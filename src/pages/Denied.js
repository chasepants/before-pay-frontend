import Navbar from '../components/Navbar';

const Denied = () => {
  return (
    <>
      <Navbar user={null} />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h4 className="mb-0">Application Denied</h4>
              </div>
              <div className="card-body">
                <p>Your application was not approved at this time.</p>
                <p className="mb-3">If you believe this is an error, please contact support.</p>
                <a className="btn btn-primary" href="mailto:support@example.com">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Denied;