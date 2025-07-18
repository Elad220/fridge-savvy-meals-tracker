import React, { useState, useEffect, type ComponentProps, useMemo } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge as BadgeBase, badgeVariants, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Shield, Trash2, Globe, ExternalLink, Bot, Settings as SettingsIcon, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApiTokens } from '@/hooks/useApiTokens';
import { AIProvider, AI_PROVIDERS } from '@/types/aiProvider';
import { AIProviderFactory } from '@/lib/ai-providers/factory';
import UserProfile from './UserProfile';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

// Local alias with proper props
const Badge: React.FC<BadgeProps> = BadgeBase as React.FC<BadgeProps>;

const MultiProviderSettings = () => {
  const { 
    providerTokens, 
    selectedProvider, 
    setSelectedProvider,
    saveTokenForProvider, 
    removeTokenForProvider, 
    getLanguage, 
    saveLanguage,
    aiRecommendationsEnabled,
    saveAiRecommendationsEnabled,
  } = useApiTokens();

  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [additionalFields, setAdditionalFields] = useState<Record<string, Record<string, string>>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSavingAiPref, setIsSavingAiPref] = useState(false);
  const [activeTab, setActiveTab] = useState('providers');

  const supportedProviders = AIProviderFactory.getSupportedProviders();

  const languages = [
    'English', 'Hebrew', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic'
  ];

  // Load current language on component mount
  useEffect(() => {
    const loadLanguage = async () => {
      const currentLanguage = await getLanguage();
      setSelectedLanguage(currentLanguage || 'English');
    };
    loadLanguage();
  }, [getLanguage]);

  const handleSaveToken = async (provider: AIProvider) => {
    const token = tokens[provider];
    if (!token?.trim()) return;

    setIsSaving(prev => ({ ...prev, [provider]: true }));
    
    const providerConfig = AI_PROVIDERS[provider];
    const additionalData = additionalFields[provider];
    
    // Validate required additional fields
    if (providerConfig.additionalFields) {
      for (const [fieldKey, fieldConfig] of Object.entries(providerConfig.additionalFields)) {
        if (fieldConfig.required && !additionalData?.[fieldKey]?.trim()) {
          setIsSaving(prev => ({ ...prev, [provider]: false }));
          return;
        }
      }
    }

    const success = await saveTokenForProvider(provider, token.trim(), additionalData);
    if (success) {
      setTokens(prev => ({ ...prev, [provider]: '' }));
      setAdditionalFields(prev => ({ ...prev, [provider]: {} }));
    }
    setIsSaving(prev => ({ ...prev, [provider]: false }));
  };

  const handleSaveLanguage = async () => {
    setIsSavingLanguage(true);
    await saveLanguage(selectedLanguage);
    setIsSavingLanguage(false);
  };

  const handleToggleAiRecommendations = async (enabled: boolean) => {
    setIsSavingAiPref(true);
    await saveAiRecommendationsEnabled(enabled);
    setIsSavingAiPref(false);
  };

  const handleRemoveToken = async (provider: AIProvider) => {
    setIsRemoving(prev => ({ ...prev, [provider]: true }));
    await removeTokenForProvider(provider);
    setIsRemoving(prev => ({ ...prev, [provider]: false }));
  };

  const handleProviderChange = async (provider: AIProvider) => {
    await setSelectedProvider(provider);
  };

  const updateAdditionalField = (provider: AIProvider, fieldKey: string, value: string) => {
    setAdditionalFields(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [fieldKey]: value
      }
    }));
  };

  const getProviderStatusBadge = (provider: AIProvider) => {
    const hasToken = providerTokens[provider];
    const isSelected = selectedProvider === provider;

    let variant: BadgeVariant = 'default';
    let label = '';
    let extraClass = '';

    if (isSelected && hasToken) {
      // Active provider with a saved token
      variant = 'default';
      label = 'Active';
      extraClass = 'bg-green-600 text-white border-green-600';
    } else if (hasToken) {
      // Provider has a token but isn\'t the active one
      variant = 'outline';
      label = 'Configured';
      extraClass = 'text-blue-600 border-blue-600 bg-transparent';
    } else {
      // No token stored yet
      variant = 'outline';
      label = 'Not Set';
      extraClass = 'text-red-600 border-red-600 bg-transparent';
    }

    const badgeProps: ComponentProps<typeof Badge> = {
      className: cn(badgeVariants({ variant }), extraClass),
    };

    return <Badge {...badgeProps}>{label}</Badge>;
  };

  const settingsStats = useMemo(() => ({
    totalProviders: supportedProviders.length,
    configuredProviders: supportedProviders.filter(provider => providerTokens[provider]).length,
    activeProvider: selectedProvider,
    aiRecommendations: aiRecommendationsEnabled ? 'Enabled' : 'Disabled',
  }), [supportedProviders, providerTokens, selectedProvider, aiRecommendationsEnabled]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <UserProfile />
      
      {/* Quick stats overview */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Settings Overview</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{settingsStats.configuredProviders}</div>
            <div className="text-xs text-muted-foreground">Configured</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{settingsStats.totalProviders - settingsStats.configuredProviders}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{settingsStats.totalProviders}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {settingsStats.aiRecommendations === 'Enabled' ? '✓' : '✗'}
            </div>
            <div className="text-xs text-muted-foreground">AI Recs</div>
          </div>
        </div>
        <div className="text-center pt-2 border-t border-border/50">
          <div className="text-sm font-medium text-primary">{AI_PROVIDERS[settingsStats.activeProvider].name}</div>
          <div className="text-xs text-muted-foreground">Active Provider</div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="glass-card p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
                <div>
                  <p className="font-medium">Active Provider</p>
                  <p className="text-sm text-muted-foreground">
                    {AI_PROVIDERS[selectedProvider].name}
                  </p>
                </div>
                {getProviderStatusBadge(selectedProvider)}
              </div>

              <div className="space-y-2">
                <p className="font-medium">Provider Status</p>
                {supportedProviders.map(provider => {
                  const hasToken = providerTokens[provider];
                  const isActive = selectedProvider === provider;
                  return (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded bg-background/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{AI_PROVIDERS[provider].name}</span>
                        {isActive && (
                          <Badge className={cn(badgeVariants({ variant: 'outline' }), 'text-green-600 border-green-600 bg-transparent text-xs')}>
                            Active
                          </Badge>
                        )}
                      </div>
                      {hasToken ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="glass-card p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language Preferences
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the language for AI responses
                </p>
                <div className="flex gap-2">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(language => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSaveLanguage} 
                    disabled={isSavingLanguage}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingLanguage ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Default AI Provider
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose which AI provider to use by default
                </p>
                <Select 
                  value={selectedProvider} 
                  onValueChange={(value) => handleProviderChange(value as AIProvider)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedProviders.map(provider => (
                      <SelectItem 
                        key={provider} 
                        value={provider}
                        disabled={!providerTokens[provider]}
                      >
                        <div className="flex items-center gap-2">
                          {AI_PROVIDERS[provider].name}
                          {!providerTokens[provider] && (
                            <span className="text-xs text-muted-foreground">(Not configured)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  AI Recommendations
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enable or disable AI-powered recommendations in the dashboard to
                  avoid unintended usage.
                </p>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={aiRecommendationsEnabled}
                    onCheckedChange={handleToggleAiRecommendations}
                    disabled={isSavingAiPref}
                  />
                  <span className="text-sm text-muted-foreground">
                    {aiRecommendationsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          {supportedProviders.map(provider => {
            const config = AI_PROVIDERS[provider];
            const hasToken = providerTokens[provider];
            const isActive = isSaving[provider];
            const isRemovingProvider = isRemoving[provider];

            return (
              <div key={provider} className="glass-card p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          {config.name}
                          {getProviderStatusBadge(provider)}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {config.description}
                          <a 
                            href={config.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`token-${provider}`}>{config.tokenLabel}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id={`token-${provider}`}
                          type="password"
                          value={tokens[provider] || ''}
                          onChange={(e) => setTokens(prev => ({ ...prev, [provider]: e.target.value }))}
                          placeholder={hasToken ? "••••••••••••••••••••••••••••••••••••••" : config.tokenPlaceholder}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleSaveToken(provider)}
                          disabled={!tokens[provider]?.trim() || isActive}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          {isActive ? 'Saving...' : hasToken ? 'Update' : 'Save'}
                        </Button>
                      </div>
                    </div>

                    {/* Additional fields for providers that need them */}
                    {config.additionalFields && Object.entries(config.additionalFields).map(([fieldKey, fieldConfig]) => (
                      <div key={fieldKey}>
                        <Label htmlFor={`${provider}-${fieldKey}`}>
                          {fieldConfig.label}
                          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {fieldConfig.type === 'select' ? (
                          <Select 
                            value={additionalFields[provider]?.[fieldKey] || ''}
                            onValueChange={(value) => updateAdditionalField(provider, fieldKey, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={fieldConfig.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldConfig.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`${provider}-${fieldKey}`}
                            type={fieldKey.toLowerCase().includes('secret') ? 'password' : 'text'}
                            value={additionalFields[provider]?.[fieldKey] || ''}
                            onChange={(e) => updateAdditionalField(provider, fieldKey, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}

                    <p className="text-xs text-muted-foreground">
                      Your credentials will be stored securely and encrypted.
                    </p>

                    {hasToken && (
                      <div className="pt-4 border-t border-border">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Token
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {config.name} Token</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove your {config.name} API token? 
                                This will disable AI features using this provider until a new token is added.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveToken(provider)}
                                disabled={isRemovingProvider}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isRemovingProvider ? 'Removing...' : 'Remove Token'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiProviderSettings;