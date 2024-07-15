import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from './Components/loading.json';
import api from './api';
import './Dashboard.css'

const Dashboard = () => {
    const [connectionCode, setConnectionCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadScript('/script.js');
        fetchConnectionCode();
    }, []);

    const fetchConnectionCode = async () => {
        try {
            const response = await api.get('/getConnectionId');
            const code = response.data.connectionId;
            setConnectionCode(code);
            window.connectionCode = code;
        } catch (error) {
            console.error('Error fetching Connection Code:', error);
        }
    };

    const handleLogout = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false); 
            navigate('/login');
            localStorage.removeItem('token');
        }, 1000);
        setLoading(true);
    };

    const loadScript = (src) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };
    const handlestreamtohost=()=>{
        window.stopScreenSharing();
        document.getElementById("screenshare-container").hidden = true;
        document.getElementById("stopscreen").hidden=true;
        document.getElementById("tohost").hidden = true;
        document.getElementById("gethost").hidden = true;


    }
    const handlesharetohost=()=>{
        window.shareScreenToHost();
        setTimeout(() => {
            document.getElementById("stopscreen").hidden = false;
        }, 8000);
    }

    return (
        <div className='background'>
            <div className='dashboard-container'>
                <div className='logout-button-div'>
                    <button onClick={handleLogout} className='logout-button'><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
                </div>
                <div>{loading && (
                <div className="loading-logo">
                    <Lottie options={defaultOptions} height={80} width={80} />
                </div>
            )}</div>              
                <div id="notification" className="notification hidden"></div>
                <div className="header" id='header' hidden>
                    <div className='A'>
                        <div className='connection-code-div'>
                        {connectionCode && (<p className='connection-code'>{connectionCode}</p>)}
                        </div>
                        <div className='button'>
                            <button className="tohost" type="submit" onClick={() => window.createConnection()}>Connect as Host</button>
                        </div>   
                    </div>
                    <div className='B'>
                    <input className='connection-id-input' id="connection-input" type="text" placeholder="Enter Connection Code" required />
                    <div className='button'>
                        <button className="toremote" type="submit" onClick={() => window.joinconnection()}>Connect as Remote</button>
                    </div>
                    </div>        
                    
                </div>
                <div className='screen-share-options' id="popup-container" >
                    <button className='gethostscreen' id='gethost' type="submit" onClick={() => window.getHostScreen()} hidden>Get Host Screen</button>
                    <button className='sharescreentohost' id='tohost' type="submit" onClick={handlesharetohost}hidden>Share My Screen to Host</button>
                </div>
                <div className='stopoptions'>
                    <button className="stopscreen" id='stopscreen' type="submit" onClick={handlestreamtohost} hidden>Stop Sharing</button>
                </div>
                <div className='screencontainers' >
                    <div id="screenshare-container" hidden>
                        {/* <h3 className='displayoption'>Shared Screen</h3> */}
                        <video height="30%" width="100%" id="screenshared-video" controls controlslist=" nodownload noremoteplayback noplaybackrate nofoobar" className="local-video"></video>
                    </div>  
                    <div id="remote-vid-container" style={{marginTop:'2vh'}} hidden>
                    <div>
                    {/* <h3 className='displayoption'>Remote Screen</h3> */}
                    </div>    
                        <video height="30%" width="100%" id="remote-video" controls controlslist="nodownload noremoteplayback noplaybackrate foobar" className="remote-video"></video>
                    </div>                   
                </div>
                
            </div>
        </div>
    );
};

export default Dashboard;
