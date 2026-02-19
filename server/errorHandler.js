import {NextResponse} from "next/server";
import {TimeLogNotFound} from "./features/timeLog/TimeLogError.js";
import {
    InvalidParameterException,
    InvalidPasswordException,
    UsernameExistsException
} from "@aws-sdk/client-cognito-identity-provider";

export function errorHandler(error){

    if(error instanceof TimeLogNotFound){
        return NextResponse.json({message: error.message}, {status: 404});
    }

    if(error instanceof InvalidPasswordException){
        return NextResponse.json({message: error.message}, {status: 400});
    }

    if(error instanceof InvalidParameterException){
        return NextResponse.json({message: error.message}, {status: 400});
    }

    if(error instanceof UsernameExistsException){
        return NextResponse.json({message: error.message}, {status: 400});
    }

    console.error("Internal server error");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // Generate request ID for tracing
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.error(`[Request ID: ${requestId}]`);
    
    // Log database connection errors with more context
    if (error?.message?.includes('ETIMEDOUT') || 
        error?.message?.includes('ECONNREFUSED') ||
        error?.name === 'SequelizeConnectionError') {
        console.error(`[Database Connection Error] Host: ${process.env.DATABASE_HOST}, Port: ${process.env.DATABASE_PORT}`);
        console.error(`[Database Connection Error] Runtime: ${typeof process !== 'undefined' ? 'Node.js' : 'Unknown'}`);
    }
    
    // In development, include more error details
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
            message: error?.message || "Error interno del servidor",
            error: error?.name,
            requestId: requestId,
            details: error?.stack
        }, {status: 500});
    }
    
    // TODO Implement AWS SNS for internal server errors
    return NextResponse.json({
        message: "Error interno del servidor",
        requestId: requestId
    }, {status: 500});
}