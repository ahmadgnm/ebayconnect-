import { type EbayCredentials, type InsertEbayCredentials, type EbayTokenResponse } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createOrUpdateCredentials(credentials: InsertEbayCredentials & { accessToken?: string; tokenType?: string; expiresIn?: string; scope?: string }): Promise<EbayCredentials>;
  getLatestCredentials(): Promise<EbayCredentials | undefined>;
}

export class MemStorage implements IStorage {
  private credentials: Map<string, EbayCredentials>;

  constructor() {
    this.credentials = new Map();
  }

  async createOrUpdateCredentials(
    credentialsData: InsertEbayCredentials & { 
      accessToken?: string; 
      tokenType?: string; 
      expiresIn?: string; 
      scope?: string; 
    }
  ): Promise<EbayCredentials> {
    const id = randomUUID();
    const credentials: EbayCredentials = {
      id,
      clientId: credentialsData.clientId,
      clientSecret: credentialsData.clientSecret,
      environment: credentialsData.environment,
      accessToken: credentialsData.accessToken || null,
      tokenType: credentialsData.tokenType || null,
      expiresIn: credentialsData.expiresIn || null,
      scope: credentialsData.scope || null,
      tokenCreatedAt: credentialsData.accessToken ? new Date() : null,
      createdAt: new Date(),
    };
    
    this.credentials.set(id, credentials);
    return credentials;
  }

  async getLatestCredentials(): Promise<EbayCredentials | undefined> {
    const allCredentials = Array.from(this.credentials.values());
    if (allCredentials.length === 0) return undefined;
    
    return allCredentials.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    )[0];
  }
}

export const storage = new MemStorage();
