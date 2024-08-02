// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import Lottie from 'react-lottie';
// import animationData from './Components/loading.json'; 
// import './Login.css'; 

// const Login = () => {
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         setLoading(true);
//         try {
//             const response = await axios.post('http://localhost:5000/api/users/login', { username, password });
//             if (response.data.success) {
//                 localStorage.setItem('token', response.data.token);
//                 setTimeout(() => {
//                     setLoading(false); 
//                     navigate('/dashboard'); 
//                 }, 500);
//             } else {
//                 setLoading(false);
//                 setError('Invalid username or password');
//                 setTimeout(() => {
//                     setError('');
//                 }, 3000);
//             }
//         } catch (error) {
//             setLoading(false);
//             console.error('There was an error while logging in!', error);
//             setError('Invalid username or password');
//             setTimeout(() => {
//                 setError('');
//             }, 3000);
//         }
//     };

//     const defaultOptions = {
//         loop: true,
//         autoplay: true,
//         animationData: animationData,
//         rendererSettings: {
//             preserveAspectRatio: 'xMidYMid slice'
//         }
//     };

//     return (
//         <div className="login-container">
//             {loading && (
//                 <div className="loading-logo">
//                     <Lottie options={defaultOptions} height={80} width={80} />
//                 </div>
//             )}
//             <form className="login-form" onSubmit={handleSubmit}>
//                 <h2>User Login</h2>
//                 <div>
//                     <label>Username:</label>
//                     <input
//                         type="text"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label>Password:</label>
//                     <input
//                         type="password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                     />
//                 </div>
//                 {error && <p>{error}</p>}
//                 <button type="submit">Login</button>
//             </form>
//         </div>
//     );
// };

// export default Login;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from './Components/loading.json'; 
import './Login.css'; 

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkTokenExpiration = async () => {
            try {
                const jwt_decode = (await import('jwt-decode')).default;
                const token = localStorage.getItem('token');
                if (token) {
                    const decodedToken = jwt_decode(token);
                    const currentTime = Date.now() / 1000;
                    if (decodedToken.exp < currentTime) {
                        localStorage.removeItem('token');
                        console.log('Token has expired and has been removed from local storage.');
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error('Error while decoding token:', error);
            }
        };
    
        checkTokenExpiration(); // Initial check on component mount
        const interval = setInterval(checkTokenExpiration, 60000); // Check every 60 seconds
    
        return () => clearInterval(interval); // Clean up interval on component unmount
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/users/login';
            const response = await axios.post('http://localhost:5000/api/users/login', { username, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setTimeout(() => {
                    setLoading(false); 
                    navigate('/dashboard'); 
                }, 500);
            } else {
                setLoading(false);
                setError('Invalid username or password');
                setTimeout(() => {
                    setError('');
                }, 3000);
            }
        } catch (error) {
            setLoading(false);
            console.error('There was an error while logging in!', error);
            setError('Invalid username or password');
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    return (
        <div className="login-container">
            {loading && (
                <div className="loading-logo">
                    <Lottie options={defaultOptions} height={80} width={80} />
                </div>
            )}
            <form className="login-form" onSubmit={handleSubmit}>
            <i style={{marginTop:'6%'}} className="fa-solid fa-user fa-4x"></i>
                <div className='detailcontainer'>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                </div>
                {error && <p>{error}</p>}
                <button type="submit"><i className="fa-solid fa-right-to-bracket"></i> &nbsp;Login</button>
            </form>
        </div>
    );
};

export default Login;
