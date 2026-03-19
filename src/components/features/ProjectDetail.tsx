"use client";

interface ProjectDetailProps {
  label: string;
  value: React.ReactNode;
}

const ProjectDetail = ({ label, value }: ProjectDetailProps) => {
  return (
    <div>
      <span className="detail-label">
        {label}:
      </span>
      <br />
      <span className="detail-value">
        {value}
      </span>
    </div>
  );
};

export default ProjectDetail;
