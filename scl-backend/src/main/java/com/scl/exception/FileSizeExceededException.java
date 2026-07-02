package com.scl.exception;

public class FileSizeExceededException extends RuntimeException {
    
    private final int maxSizeInMB;

    public FileSizeExceededException(String message, int maxSizeInMB) {
        super(message);
        this.maxSizeInMB = maxSizeInMB;
    }

    public int getMaxSizeInMB() {
        return maxSizeInMB;
    }
}
