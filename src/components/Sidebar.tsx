import React from 'react';
import { BookOpen, Users, GraduationCap, ClipboardList, BarChart3, Database, LogOut, User } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'classi', label: 'Gestione Classi', icon: GraduationCap },
  { id: 'materie', label: 'Gestione Materie', icon: BookOpen },
  { id: 'alunni', label: 'Gestione Alunni', icon: Users },
  { id: 'registro', label: 'Registro Voti', icon: ClipboardList },
  { id: 'medie', label: 'Medie e Statistiche', icon: BarChart3 },
  { id: 'database', label: 'Gestione Database', icon: Database },
];

export default function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  return (
    <div className="w-64 bg-blue-900 text-white h-screen shadow-lg">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2">Registro Scolastico</h1>
          <div className="flex items-center space-x-2 text-blue-200 text-sm">
            <User className="h-4 w-4" />
            <span>Benvenuta, Maestra</span>
          </div>
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-700 text-white'
                        : 'hover:bg-blue-800 text-blue-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Pulsante Logout */}
        <div className="mt-8">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-blue-800 text-blue-100"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Esci</span>
          </button>
        </div>
      </div>
    </div>
  );
}