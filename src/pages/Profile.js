// frontend/src/pages/Profile.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    setProfileLoaded(true);
    fetchDocuments();
  }, [user, userLoading, navigate]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/documents', { withCredentials: true });
      console.log(response)
      setDocuments(response.data.documents || []);
    } catch (err) {
      setError('Failed to fetch documents: ' + err.message);
    }
  };

  const handleDocumentUpload = async (docId) => {
    if (!newDocument || !user.unitApplicationId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('applicationId', user.unitApplicationId);
    formData.append('documentId', docId);
    formData.append('file', newDocument);

    try {
      await axios.put(
        'http://localhost:3001/api/auth/document/upload',
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      await fetchDocuments(); // Refresh document list
      setNewDocument(null);
      setError('');
    } catch (err) {
      setError('Failed to upload document: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setNewDocument(e.target.files[0]); // Single file for now
  };

  if (!profileLoaded || userLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className='container my-5'>
        <div className='row'>
          <div className='col-12'>
            <div className='card border-0 shadow-sm bg-light p-4'>
              <div className='card-body d-flex justify-content-between'>
                <div>
                  <p><strong>Name:</strong> {`${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                  <p><strong>Occupation:</strong> {user.occupation || 'Not specified'}</p>
                  <p><strong>Status:</strong> {user.status === 'awaitingDocuments' ? 'Awaiting Documents' : user.status}</p>
                </div>
                <div>
                  <p><strong>Address:</strong> {user.address?.line1 || ''}, {user.address?.city || ''}, {user.address?.state || ''} {user.address?.postalCode || ''}</p>
                  <p><strong>Birthdate:</strong> {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  <p><strong>SSN Last 4:</strong> {user.ssnLast4 || 'Not provided'}</p>
                  <p><strong>Annual Income:</strong> {user.annualIncome || 'Not specified'}</p>
                  <p><strong>Source of Income:</strong> {user.sourceOfIncome || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user.status === 'awaitingDocuments' && (
          <div className='row mt-5'>
            <div className='col-12'>
              <h4>Required Documents</h4>
              {error && <p className='text-danger'>{error}</p>}
              <table className='table table-striped'>
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className='align-middle'>
                        {doc.attributes.documentType}
                        <span
                          className='ms-2 tooltip-container'
                          onMouseEnter={(e) => (e.currentTarget.querySelector('.tooltip-text').style.display = 'block')}
                          onMouseLeave={(e) => (e.currentTarget.querySelector('.tooltip-text').style.display = 'none')}
                        >
                          <i className='bi bi-info-circle text-muted'></i>
                          <span className='tooltip-text'>{doc.attributes.description}</span>
                        </span>
                      </td>
                      <td className='align-middle'>{doc.attributes.status}</td>
                      <td className='align-middle'>
                        {doc.attributes.status === 'Required' && (
                          <div>
                            <input
                              type='file'
                              className='form-control form-control-sm mb-2'
                              onChange={(e) => handleFileChange(e)}
                            />
                            <button
                              className='btn btn-primary btn-sm'
                              onClick={() => handleDocumentUpload(doc.id)}
                              disabled={isLoading || !newDocument}
                            >
                              {isLoading ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;