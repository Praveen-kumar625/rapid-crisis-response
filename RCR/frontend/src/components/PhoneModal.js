import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

const PhoneModal = ({ isOpen, onClose, onSubmit }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');

    // Reset state when modal is toggled
    useEffect(() => {
        if (!isOpen) {
            setPhoneNumber('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Strip non-numeric immediately
        if (value.length <= 10) {
            setPhoneNumber(value);
            if (error) setError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Indian Mobile Number Validation: 10 digits starting with 6-9
        const indianPhoneRegex = /^[6-9]\d{9}$/;

        if (!phoneNumber) {
            setError('Phone number is required');
            return;
        }

        if (!indianPhoneRegex.test(phoneNumber)) {
            setError('Please enter a valid 10-digit Indian mobile number');
            return;
        }

        // Submit validated string with country prefix
        onSubmit(`+91${phoneNumber}`);
        onClose();
    };

    return ( <
            div className = "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none" > { /* Backdrop */ } <
            div className = "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick = { onClose }
            />

            { /* Modal Card */ } <
            div className = "relative w-full max-w-md mx-auto transition-all transform duration-300 bg-white rounded-2xl shadow-2xl" > { /* Close Button */ } <
            button onClick = { onClose }
            className = "absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria - label = "Close" >
            <
            X size = { 20 }
            /> < /
            button >

            <
            div className = "p-8" > { /* Header Icon */ } <
            div className = "flex items-center justify-center w-14 h-14 mb-6 bg-blue-50 rounded-full text-blue-600 mx-auto border border-blue-100 shadow-inner" >
            <
            Phone size = { 28 }
            /> < /
            div >

            <
            h3 className = "text-2xl font-bold text-center text-gray-900 mb-2" >
            Emergency SMS Alerts <
            /h3> <
            p className = "text-sm text-center text-gray-500 mb-8 leading-relaxed" >
            Get instant critical updates during emergencies.We & apos; ll send real - time alerts and safety protocols directly to your phone. <
            /p>

            { /* Input Form */ } <
            form onSubmit = { handleSubmit }
            className = "space-y-6" >
            <
            div className = "relative" >
            <
            label htmlFor = "phone"
            className = "block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1" >
            Enter Mobile Number <
            /label> <
            div className = "relative group" >
            <
            div className = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-semibold border-r border-gray-200 pr-3 mr-4" >
            +91 <
            /div> <
            input type = "text"
            id = "phone"
            value = { phoneNumber }
            onChange = { handlePhoneChange }
            placeholder = "7801978844"
            className = { `block w-full pl-16 pr-4 py-4 bg-gray-50 border-2 ${
                    error 
                      ? 'border-red-500 ring-4 ring-red-500/10' 
                      : 'border-gray-100 group-hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  } rounded-xl text-gray-900 placeholder-gray-300 outline-none transition-all duration-200 text-xl tracking-[0.2em] font-medium` }
            autoFocus autoComplete = "off" /
            >
            <
            /div> {
            error && ( <
                div className = "mt-3 text-sm text-red-500 flex items-center font-medium animate-in fade-in slide-in-from-top-1" >
                <
                span className = "inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]" / > { error } <
                /div>
            )
        } <
        /div>

    { /* Actions */ } <
    div className = "flex flex-col sm:flex-row gap-3 pt-2" >
        <
        button type = "button"
    onClick = { onClose }
    className = "flex-1 px-6 py-3.5 text-sm font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-700 border border-gray-100 transition-all active:scale-[0.98]" >
        Maybe Later <
        /button> <
    button type = "submit"
    className = "flex-1 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] hover:-translate-y-0.5" >
        Enable Alerts <
        /button> < /
    div > <
        /form> < /
    div > <
        /div> < /
    div >
);
};

export default PhoneModal;