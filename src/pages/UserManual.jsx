import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/lib/AuthContext';
import { User, Shield, Eye, BarChart3, ClipboardEdit, Settings } from 'lucide-react';

export default function UserManual() {
  const { lang } = useOutletContext();
  const { user, ROLES } = useAuth();

  const content = {
    en: {
      title: 'User Manual',
      subtitle: 'Learn how to use VERHUS based on your role',
      collector: {
        title: 'Data Collector',
        description: 'Responsible for entering weekly health data',
        permissions: [
          'Enter weekly health data via Live Weekly Entry',
          'View dashboard for entered data',
          'Access health areas information'
        ],
        workflow: [
          'Navigate to "Live Weekly Entry" from the sidebar',
          'Complete all required steps in the data entry wizard',
          'Review and submit your weekly data',
          'Monitor your submissions on the Dashboard'
        ]
      },
      supervisor: {
        title: 'Supervisor',
        description: 'Oversees data collection and validates entries',
        permissions: [
          'All Collector permissions',
          'Access Main Database for data review',
          'View Maps & Coverage analytics',
          'Export data and reports',
          'Validate and approve data entries'
        ],
        workflow: [
          'Review submitted data in Main Database',
          'Validate data quality and completeness',
          'Use Maps & Coverage for regional analysis',
          'Generate exports for reporting',
          'Provide feedback to collectors'
        ]
      },
      admin: {
        title: 'Administrator',
        description: 'Full system access and user management',
        permissions: [
          'All Supervisor permissions',
          'Manage health areas and districts',
          'Configure system settings',
          'User management and role assignment',
          'System maintenance and backups'
        ],
        workflow: [
          'Monitor overall system health',
          'Manage user accounts and permissions',
          'Configure health areas and districts',
          'Oversee data quality across all regions',
          'Generate comprehensive reports'
        ]
      }
    },
    fr: {
      title: 'Manuel d\'utilisation',
      subtitle: 'Apprenez à utiliser VERHUS selon votre rôle',
      collector: {
        title: 'Collecteur de données',
        description: 'Responsable de la saisie des données de santé hebdomadaires',
        permissions: [
          'Saisir les données de santé hebdomadaires',
          'Consulter le tableau de bord des données saisies',
          'Accéder aux informations des aires de santé'
        ],
        workflow: [
          'Naviguer vers "Saisie hebdomadaire" depuis la barre latérale',
          'Compléter toutes les étapes requises dans l\'assistant',
          'Réviser et soumettre vos données hebdomadaires',
          'Surveiller vos soumissions sur le tableau de bord'
        ]
      },
      supervisor: {
        title: 'Superviseur',
        description: 'Supervise la collecte de données et valide les entrées',
        permissions: [
          'Toutes les permissions du Collecteur',
          'Accès à la base principale pour révision',
          'Consulter les cartes et analyses de couverture',
          'Exporter des données et rapports',
          'Valider et approuver les saisies'
        ],
        workflow: [
          'Réviser les données soumises dans la base principale',
          'Valider la qualité et complétude des données',
          'Utiliser les cartes pour l\'analyse régionale',
          'Générer des exports pour les rapports',
          'Fournir des commentaires aux collecteurs'
        ]
      },
      admin: {
        title: 'Administrateur',
        description: 'Accès complet au système et gestion des utilisateurs',
        permissions: [
          'Toutes les permissions du Superviseur',
          'Gérer les aires de santé et districts',
          'Configurer les paramètres système',
          'Gestion des utilisateurs et attribution des rôles',
          'Maintenance système et sauvegardes'
        ],
        workflow: [
          'Surveiller la santé globale du système',
          'Gérer les comptes utilisateurs et permissions',
          'Configurer les aires de santé et districts',
          'Superviser la qualité des données dans toutes les régions',
          'Générer des rapports complets'
        ]
      }
    }
  };

  const t = content[lang];
  const roleData = {
    [ROLES.COLLECTOR]: t.collector,
    [ROLES.SUPERVISOR]: t.supervisor,
    [ROLES.ADMIN]: t.admin
  };

  const RoleCard = ({ role, data, isCurrentRole }) => (
    <Card className={isCurrentRole ? 'ring-2 ring-primary' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          {data.title}
          {isCurrentRole && <Badge variant="secondary">{lang === 'en' ? 'Your Role' : 'Votre rôle'}</Badge>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {lang === 'en' ? 'Permissions' : 'Permissions'}
          </h4>
          <ul className="space-y-1 text-sm">
            {data.permissions.map((permission, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {permission}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {lang === 'en' ? 'Typical Workflow' : 'Flux de travail typique'}
          </h4>
          <ol className="space-y-1 text-sm">
            {data.workflow.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[1.5rem]">{idx + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Tabs defaultValue={user?.role || ROLES.COLLECTOR} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={ROLES.COLLECTOR} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t.collector.title}
          </TabsTrigger>
          <TabsTrigger value={ROLES.SUPERVISOR} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t.supervisor.title}
          </TabsTrigger>
          <TabsTrigger value={ROLES.ADMIN} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t.admin.title}
          </TabsTrigger>
        </TabsList>

        {Object.entries(roleData).map(([role, data]) => (
          <TabsContent key={role} value={role} className="mt-6">
            <RoleCard 
              role={role} 
              data={data} 
              isCurrentRole={user?.role === role}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}