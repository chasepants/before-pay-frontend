const Signup = () => {
    return (
        <div className="container">
            <div className="row">
                <div className="border border-black col-sm-6 mt-5 offset-sm-3 p-5 rounded-5 text-center">
                    <h1>SIGN UP</h1>
                    <h5>Set up an account to start saving</h5>
                    <input className="form-control form-control-lg mt-3" type="text" placeholder="Name" aria-label="Name"/>
                    <input className="form-control form-control-lg mt-3" type="text" placeholder="Email" aria-label="Email"/>
                    <input className="form-control form-control-lg mt-3" type="text" placeholder="Password" aria-label="Password"/>
                    <button className="btn btn-primary w-50 mt-5">Sign Up</button>
                    <h5 className="mt-5">------------------- OR ------------------</h5>
                    <button className="btn btn-danger mt-5" onClick={() => window.location = "http://localhost:3001/api/auth/google"}>
                        Continue with Google
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-6 mt-5 offset-sm-3 text-center">
                    <h5>
                        Have an account with us?&nbsp; 
                        <a href="/login"><span style={{color: "#ff914d"}}>Login</span></a>
                    </h5>
                </div>
            </div>
        </div>
    )
}

export default Signup;