import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';

export default function Settings() {
  const { lang } = useOutletContext();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {lang === 'en' ? 'Settings' : 'Paramètres'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {lang === 'en' ? 'Profile' : 'Profil'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Name' : 'Nom'}</p>
              <p className="font-medium">{user?.full_name || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'en' ? 'Role' : 'Rôle'}</p>
              <p className="font-medium flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                {user?.role || 'user'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <Button
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="h-4 w-4" />
            {lang === 'en' ? 'Sign Out' : 'Déconnexion'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}