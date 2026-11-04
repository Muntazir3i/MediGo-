import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Components/Sidebar.jsx';
import CommandPalette from './Components/CommandPalette.jsx';

function Layout() {
    const [paletteOpen, setPaletteOpen] = useState(false);

    return (
        <div className="flex h-dvh overflow-hidden bg-slate-50">
            <Sidebar onOpenPalette={() => setPaletteOpen(true)} />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Outlet />
            </div>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
    );
}

export default Layout;
