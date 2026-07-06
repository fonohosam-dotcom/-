const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'interface AdminPortalProps {',
  'import { useNavigate } from "react-router-dom";\ninterface AdminPortalProps {\n  view?: "cases" | "projects" | "geosos" | "funds" | "dashboard";'
);

code = code.replace(
  'export default function AdminPortal({\n  user,\n  cases,\n  projects,\n  ledger,\n  funds,\n  reports,\n  users,\n  onApproveCase,\n  onRejectCase,\n  onUpdateCaseBudget,\n  onApproveProject,\n  onRejectProject,\n  onUpdateProjectBudget,\n  onUpdateReportStatus,\n  onTriggerGeoSOS,\n  onRefresh,\n}: AdminPortalProps) {',
  `export default function AdminPortal({
  user,
  cases,
  projects,
  ledger,
  funds,
  reports,
  users,
  onApproveCase,
  onRejectCase,
  onUpdateCaseBudget,
  onApproveProject,
  onRejectProject,
  onUpdateProjectBudget,
  onUpdateReportStatus,
  onTriggerGeoSOS,
  onRefresh,
  view = "dashboard"
}: AdminPortalProps) {
  const navigate = useNavigate();`
);

// We need to render conditionally based on view.
// In AdminPortal, it renders a list of cards vertically. We will wrap them.
// "geosos-broadcast-panel", "pending-applications-box", "projects-approval-box", "funds-box"

code = code.replace(
  '{/* Geo-SOS Emergency Geographic Broadcast System */}',
  '{(view === "geosos" || view === "dashboard") && (\n        <>\n          {/* Geo-SOS Emergency Geographic Broadcast System */}'
);

code = code.replace(
  '              </div>\n            </div>\n\n            {/* Pending Applications Approval Box */}',
  '              </div>\n            </div>\n          </>\n        )}\n\n        {(view === "cases" || view === "dashboard") && (\n          <>\n            {/* Pending Applications Approval Box */}'
);

code = code.replace(
  '                </div>\n              </div>\n            </div>\n\n            {/* Projects & Funds Oversight Box */}',
  '                </div>\n              </div>\n            </div>\n          </>\n        )}\n\n        {(view === "projects" || view === "dashboard") && (\n          <>\n            {/* Projects & Funds Oversight Box */}'
);

code = code.replace(
  '                  </div>\n                </div>\n              </div>\n            </div>\n\n            {/* Funds Realtime Monitors */}',
  '                  </div>\n                </div>\n              </div>\n            </div>\n          </>\n        )}\n\n        {(view === "funds" || view === "dashboard") && (\n          <>\n            {/* Funds Realtime Monitors */}'
);

code = code.replace(
  '                })}\n              </div>\n            </div>\n\n          </div>\n        </div>\n      )}\n\n      {/* Reject Case Dialog Modal */}',
  '                })}\n              </div>\n            </div>\n          </>\n        )}\n\n          </div>\n        </div>\n      )}\n\n      {/* Reject Case Dialog Modal */}'
);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
