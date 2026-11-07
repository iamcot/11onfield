package com.elevenof.backoffice.exception;

/** The code could not be delivered (Zalo ZNS down, number not on Zalo, ...). */
public class OtpSendFailedException extends RuntimeException {
    public OtpSendFailedException(String message) {
        super(message);
    }
}
