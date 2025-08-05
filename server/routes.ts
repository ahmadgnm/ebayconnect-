import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ebayAuthRequestSchema, type EbayTokenResponse } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // eBay OAuth 2.0 Authentication endpoint
  app.post("/api/ebay/authenticate", async (req, res) => {
    try {
      const { clientId, clientSecret, environment } = ebayAuthRequestSchema.parse(req.body);
      
      // Determine eBay API endpoint based on environment
      const apiUrl = environment === "production" 
        ? "https://api.ebay.com/identity/v1/oauth2/token"
        : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
      
      // Create Basic Auth header
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      // Make request to eBay OAuth endpoint
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('eBay API Error:', response.status, errorText);
        
        if (response.status === 401) {
          return res.status(401).json({ 
            message: "Invalid client credentials. Please verify your Client ID and Client Secret." 
          });
        }
        
        return res.status(response.status).json({ 
          message: `eBay API Error: ${response.statusText}` 
        });
      }
      
      const tokenData: EbayTokenResponse = await response.json();
      
      // Store credentials and token in storage
      const savedCredentials = await storage.createOrUpdateCredentials({
        clientId,
        clientSecret,
        environment,
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in.toString(),
        scope: tokenData.scope,
      });
      
      res.json({
        success: true,
        credentials: savedCredentials,
        token: tokenData
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Internal server error during authentication" 
      });
    }
  });

  // Get latest credentials and token status
  app.get("/api/ebay/status", async (req, res) => {
    try {
      const credentials = await storage.getLatestCredentials();
      
      if (!credentials) {
        return res.json({ 
          connected: false, 
          message: "No credentials configured" 
        });
      }
      
      // Check if token exists and is potentially still valid
      const hasValidToken = credentials.accessToken && credentials.tokenCreatedAt;
      let isExpired = false;
      
      if (hasValidToken && credentials.expiresIn) {
        const tokenAge = Date.now() - credentials.tokenCreatedAt!.getTime();
        const expirationTime = parseInt(credentials.expiresIn) * 1000; // Convert to milliseconds
        isExpired = tokenAge >= expirationTime;
      }
      
      res.json({
        connected: hasValidToken && !isExpired,
        credentials: {
          id: credentials.id,
          environment: credentials.environment,
          hasToken: !!credentials.accessToken,
          isExpired,
          tokenCreatedAt: credentials.tokenCreatedAt,
          expiresIn: credentials.expiresIn,
          scope: credentials.scope,
          tokenType: credentials.tokenType
        },
        token: hasValidToken && !isExpired ? {
          access_token: credentials.accessToken,
          token_type: credentials.tokenType,
          expires_in: credentials.expiresIn,
          scope: credentials.scope
        } : null
      });
      
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ 
        message: "Error checking authentication status" 
      });
    }
  });

  // Validate token with eBay API
  app.post("/api/ebay/validate", async (req, res) => {
    try {
      const credentials = await storage.getLatestCredentials();
      
      if (!credentials || !credentials.accessToken) {
        return res.status(400).json({ 
          message: "No access token available to validate" 
        });
      }
      
      // Use a simple eBay API call to validate the token
      const apiUrl = credentials.environment === "production"
        ? "https://api.ebay.com/commerce/catalog/v1_beta/products"
        : "https://api.sandbox.ebay.com/commerce/catalog/v1_beta/products";
      
      const response = await fetch(`${apiUrl}?limit=1`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      const isValid = response.ok;
      
      res.json({
        valid: isValid,
        status: response.status,
        message: isValid ? "Token is valid" : `Token validation failed: ${response.statusText}`
      });
      
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ 
        message: "Error validating token" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
