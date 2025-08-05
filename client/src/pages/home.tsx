import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ebayAuthRequestSchema, type EbayAuthRequest } from "@shared/schema";
import { 
  Gavel, 
  Key, 
  Eye, 
  EyeOff, 
  Plug, 
  TestTube,
  Check,
  Copy,
  RefreshCw,
  Shield,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  CheckCircle
} from "lucide-react";

interface AuthStatus {
  connected: boolean;
  credentials?: {
    id: string;
    environment: string;
    hasToken: boolean;
    isExpired: boolean;
    tokenCreatedAt: string;
    expiresIn: string;
    scope: string;
    tokenType: string;
  };
  token?: {
    access_token: string;
    token_type: string;
    expires_in: string;
    scope: string;
  };
}

interface AuthResponse {
  success: boolean;
  credentials: any;
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };
}

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EbayAuthRequest>({
    resolver: zodResolver(ebayAuthRequestSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      environment: "sandbox",
    },
  });

  // Query to get current authentication status
  const { data: authStatus, isLoading: statusLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/ebay/status"],
  });

  // Authentication mutation
  const authenticateMutation = useMutation({
    mutationFn: async (data: EbayAuthRequest): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/ebay/authenticate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAuthError(null);
      toast({
        title: "Authentication Successful",
        description: "Your eBay access token has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ebay/status"] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Authentication failed. Please check your credentials.";
      setAuthError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Token validation mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ebay/validate");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.valid ? "Token Valid" : "Token Invalid",
        description: data.message,
        variant: data.valid ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate token",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EbayAuthRequest) => {
    authenticateMutation.mutate(data);
  };

  const handleCopyToken = async () => {
    if (authStatus?.token?.access_token) {
      try {
        await navigator.clipboard.writeText(authStatus.token.access_token);
        toast({
          title: "Copied!",
          description: "Access token has been copied to clipboard.",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy token to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRefreshToken = () => {
    const formData = form.getValues();
    if (formData.clientId && formData.clientSecret) {
      authenticateMutation.mutate(formData);
    } else {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials first.",
        variant: "destructive",
      });
    }
  };

  const handleValidateToken = () => {
    validateMutation.mutate();
  };

  const isConnected = authStatus?.connected && authStatus?.token;
  const hasError = !!authError && !authenticateMutation.isPending;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gavel className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">eBay API Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sandbox Environment</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authentication Card */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">eBay OAuth 2.0 Authentication</h2>
                <p className="text-sm text-gray-600 mt-1">Configure your eBay application credentials to generate access tokens</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Credentials Form */}
          <div className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Client ID Input */}
              <div>
                <Label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="clientId"
                    {...form.register("clientId")}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your eBay Client ID"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Key className="text-gray-400" size={16} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Found in your eBay Developer Account under Application Keys
                </p>
                {form.formState.errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.clientId.message}</p>
                )}
              </div>

              {/* Client Secret Input */}
              <div>
                <Label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    type={showPassword ? "text" : "password"}
                    {...form.register("clientSecret")}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your eBay Client Secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="text-gray-400 hover:text-gray-600" size={16} />
                    ) : (
                      <Eye className="text-gray-400 hover:text-gray-600" size={16} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Keep this secret secure and never share it publicly
                </p>
                {form.formState.errors.clientSecret && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.clientSecret.message}</p>
                )}
              </div>

              {/* Environment Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-3">Environment</Label>
                <RadioGroup
                  value={form.watch("environment")}
                  onValueChange={(value) => form.setValue("environment", value as "sandbox" | "production")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sandbox" id="sandbox" />
                    <Label htmlFor="sandbox" className="text-sm text-gray-700">Sandbox</Label>
                    <span className="text-xs text-orange-600 font-medium">Recommended</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="production" id="production" />
                    <Label htmlFor="production" className="text-sm text-gray-700">Production</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={authenticateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  {authenticateMutation.isPending ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Plug size={16} />
                  )}
                  <span>{authenticateMutation.isPending ? 'Connecting...' : 'Connect to eBay'}</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleValidateToken}
                  disabled={!isConnected || validateMutation.isPending}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  <TestTube size={16} />
                </Button>
              </div>
            </form>
          </div>

          {/* Authentication Status */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  statusLoading ? 'bg-gray-400' : 
                  isConnected ? 'bg-green-400' : 
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {statusLoading ? 'Checking status...' :
                   isConnected ? 'Connected and authenticated' :
                   'Ready to authenticate'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last attempt: {authStatus?.credentials?.tokenCreatedAt ? 
                  new Date(authStatus.credentials.tokenCreatedAt).toLocaleString() : 
                  'Never'
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Token Display Card */}
        {isConnected && authStatus?.token && (
          <Card className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="text-white" size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Authentication Successful</h3>
                    <p className="text-sm text-green-700">Access token generated and ready for API calls</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">Connected</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Access Token */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">Access Token</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToken}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </Button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <code className="text-sm font-mono text-gray-800 break-all">
                    {authStatus.token.access_token}
                  </code>
                </div>
              </div>

              {/* Token Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Token Type</div>
                  <div className="text-sm font-semibold text-gray-900">{authStatus.token.token_type}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Expires In</div>
                  <div className="text-sm font-semibold text-gray-900">{authStatus.token.expires_in} seconds</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Scope</div>
                  <div className="text-sm font-semibold text-gray-900">{authStatus.token.scope}</div>
                </div>
              </div>

              {/* Token Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleRefreshToken}
                  disabled={authenticateMutation.isPending}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Refresh Token</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleValidateToken}
                  disabled={validateMutation.isPending}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center space-x-2"
                >
                  <Shield size={16} />
                  <span>Validate</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Card */}
        {hasError && (
          <Card className="mt-8 bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-white" size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Authentication Failed</h3>
                  <p className="text-sm text-red-700">Please check your credentials and try again</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-800">{authError}</div>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button 
                  onClick={() => {
                    setAuthError(null);
                    form.handleSubmit(onSubmit)();
                  }}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://developer.ebay.com', '_blank')}
                  className="text-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  View Documentation
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="text-white" size={12} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Getting Started with eBay API</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>1. Create an eBay Developer Account and register your application</p>
                <p>2. Obtain your Client ID and Client Secret from the Application Keys section</p>
                <p>3. Start with the Sandbox environment for testing</p>
                <p>4. Use this tool to generate access tokens for your API requests</p>
              </div>
              <div className="mt-4">
                <a 
                  href="https://developer.ebay.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <span>Visit eBay Developer Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">eBay API Manager v1.0</div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="text-sm text-gray-500">Built for developers</div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://developer.ebay.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700">Documentation</a>
              <a href="https://developer.ebay.com/support" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700">Support</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
