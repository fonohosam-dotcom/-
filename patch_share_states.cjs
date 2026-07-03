const fs = require('fs');
const content = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

const newStates = `
  const [tempGoal, setTempGoal] = useState(annualGoal);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
`;

const updatedContent = content.replace(
  '  const [tempGoal, setTempGoal] = useState(annualGoal);',
  newStates.trim()
);

fs.writeFileSync('src/components/DonorPortal.tsx', updatedContent);
