# EmoVision Dashboard - Design Philosophy

## Reference Design
This is a replication task. The provided screenshot is the ground-truth spec for layout, components, and visual hierarchy. Fidelity to the reference OVERRIDES generic design guidance.

## Key Design Elements from Reference

### Color Palette
- **Primary Teal/Cyan**: `#17A2B8` or similar (used for accent buttons, badges, active states)
- **Light Gray Background**: `#F5F7FA` or similar (main background)
- **White Cards**: `#FFFFFF` (metric cards, chart container, table)
- **Dark Text**: `#1F2937` or similar (headings, body text)
- **Muted Text**: `#6B7280` or similar (labels, secondary text)
- **Status Colors**: 
  - Red/Orange for "Alto risco" (high risk)
  - Yellow for "Médio risco" (medium risk)
  - Green for "Baixo risco" (low risk)

### Layout Structure
1. **Left Sidebar**: Persistent navigation with menu items (Funcionários, Avaliadores, Testes, Relatórios, Configurações, Logout)
2. **Top Header**: Logo on left, user profile on right
3. **Main Content Area**: 
   - Three metric cards at top (EEA atual, DT atual, Evolução geral)
   - User profile card on right
   - Two-column section: "Principais fatores em atenção" + "Evolução dos testes" chart
   - "Histórico de testes realizados" table below

### Typography
- **Headlines**: Bold, dark color
- **Labels**: Muted gray, smaller size
- **Numbers**: Large, prominent, dark
- **Secondary Info**: Smaller, gray text

### Components
- **Metric Cards**: White background, subtle shadow, icon + number + label
- **Chart**: Line chart with area fill, teal/blue color scheme
- **Table**: Clean rows, status badges, action icons
- **Buttons**: Teal primary, outlined secondary
- **Badges**: Colored backgrounds for status (risk levels)

### Spacing & Rhythm
- Generous padding in cards (16-24px)
- Consistent gap between sections
- Sidebar width: ~200px
- Content padding: 24-32px

### Design Principles
1. **Professional & Trustworthy**: Clean, organized, corporate aesthetic
2. **Data-Focused**: Emphasis on metrics, charts, and tables
3. **Scannable**: Clear visual hierarchy with bold numbers and labels
4. **Accessible**: Good contrast, readable fonts, clear status indicators
5. **Modern**: Subtle shadows, rounded corners, smooth interactions
