import React from "react";
import { useNavigate } from "react-router-dom";

const OrderConfirmationScreen = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h2>Payment Successful! </h2>
            <button onClick={() => navigate("/")}>Go to Home</button>
        </div>
    );
};

export default OrderConfirmationScreen;
