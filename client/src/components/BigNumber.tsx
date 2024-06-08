import { Paper } from '@mui/material';

export const BigNumber: React.FC<{
  mainStat: React.ReactNode;
  subStat: React.ReactNode;
  label: React.ReactNode;
  colour: string;
}> = ({ colour, mainStat, subStat, label }) => {
  return (
    <Paper elevation={8} className="big-number">
      <main style={{ color: colour }}>{mainStat}</main>
      <aside>
        <span>{label}</span>
        {subStat}
      </aside>
    </Paper>
  );
};
