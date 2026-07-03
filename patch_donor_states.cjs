const fs = require('fs');
const content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

const newStates = `
  const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "impact">("dashboard");
  const [annualGoal, setAnnualGoal] = useState(() => {
    const saved = localStorage.getItem(\`annualGoal_\${user?.id || 'guest'}\`);
    return saved ? parseInt(saved, 10) : 10000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(annualGoal);

  const handleSaveGoal = () => {
    setAnnualGoal(tempGoal);
    localStorage.setItem(\`annualGoal_\${user?.id || 'guest'}\`, tempGoal.toString());
    setIsEditingGoal(false);
  };
`;

const updatedContent = content.replace(
  '  const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "impact">("dashboard");',
  newStates.trim()
);

fs.writeFileSync('src/components/DonorPortal.tsx', updatedContent);
