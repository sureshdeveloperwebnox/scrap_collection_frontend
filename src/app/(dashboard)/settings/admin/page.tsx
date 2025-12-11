'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Bell, Shield, Database, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Scrap Collection Services',
    companyEmail: 'admin@scrapcollection.com',
    companyPhone: '+61 1800 SCRAP',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // System Settings
    autoAssignment: true,
    maxCollectorsPerZone: '5',
    pickupRadius: '25',
    
    // User Profile
    adminName: 'Admin User',
    adminEmail: 'admin@scrapcollection.com',
    adminRole: 'Super Admin',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to your backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Settings</h2>
        <Button onClick={handleSaveSettings}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                  <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                  <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                  <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Full Name</Label>
              <Input
                id="adminName"
                value={settings.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminRole">Role</Label>
              <Input
                id="adminRole"
                value={settings.adminRole}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div className="pt-2">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive updates via email</div>
              </div>
              <Button
                variant={settings.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('emailNotifications', !settings.emailNotifications)}
              >
                {settings.emailNotifications ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">SMS Notifications</div>
                <div className="text-sm text-gray-500">Receive updates via SMS</div>
              </div>
              <Button
                variant={settings.smsNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('smsNotifications', !settings.smsNotifications)}
              >
                {settings.smsNotifications ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-500">Browser push notifications</div>
              </div>
              <Button
                variant={settings.pushNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('pushNotifications', !settings.pushNotifications)}
              >
                {settings.pushNotifications ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Assignment</div>
                <div className="text-sm text-gray-500">Automatically assign orders to collectors</div>
              </div>
              <Button
                variant={settings.autoAssignment ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('autoAssignment', !settings.autoAssignment)}
              >
                {settings.autoAssignment ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxCollectors">Max Collectors per Zone</Label>
              <Input
                id="maxCollectors"
                type="number"
                value={settings.maxCollectorsPerZone}
                onChange={(e) => handleInputChange('maxCollectorsPerZone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pickupRadius">Pickup Radius (km)</Label>
              <Input
                id="pickupRadius"
                type="number"
                value={settings.pickupRadius}
                onChange={(e) => handleInputChange('pickupRadius', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-center">
              <Shield className="mr-2 h-4 w-4" />
              Manage API Keys
            </Button>
            <Button variant="outline" className="flex items-center justify-center">
              <User className="mr-2 h-4 w-4" />
              User Permissions
            </Button>
            <Button variant="outline" className="flex items-center justify-center">
              <Database className="mr-2 h-4 w-4" />
              Backup Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

