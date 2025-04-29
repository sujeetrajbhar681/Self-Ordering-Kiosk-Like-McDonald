import { Box, Button, CircularProgress, Typography } from '@material-ui/core';
import React from 'react';
import Logo from '../components/Logo';
import { useStyles } from '../styles';

const PaymentScreen = (props) => {
  const styles = useStyles();

  const handlePayment = async () => {
    const response = await fetch("http://localhost:5000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500 }) // ₹500
    });
    const order = await response.json();

    var options = {
      key: "rzp_test_TnA34XM6evYxYC",
      amount: order.amount,
      currency: "INR",
      name: "Self-Order Kiosk",
      order_id: order.id,
      handler: function (response) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
      },
      theme: { color: "#F37254" }
    };
    var rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <Box className={[styles.root, styles.navy]}>
      <Box className={[styles.main, styles.center]}>
        <Box>
          <Logo large></Logo>
          <Typography
            gutterBottom
            className={styles.title}
            variant="h3"
            component="h3"
          >
            Please follow the instruction on the PIN pad
          </Typography>
          <CircularProgress />
        </Box>
      </Box>
      <Box className={[styles.center, styles.space]}>
        <Button
          onClick={handlePayment}
          variant="contained"
          color="primary"
          className={styles.largeButton}
        >
          Pay ₹500
        </Button>
        <Button
          onClick={() => props.history.push('/complete')}
          variant="contained"
          color="primary"
          className={styles.largeButton}
        >
          Complete Order
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentScreen;
