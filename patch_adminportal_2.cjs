const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const target = `              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reject Case Dialog Modal */}`;

const replacement = `              </div>
            </div>

            {/* Advanced Admin controls (Feature Flags + Ban/Delete users) */}
            {(user.isSuperAdmin || user.email === "hosam.fono" || user.id === "super-admin") && (
              <AdvancedAdmin users={users} onRefresh={() => onRefresh && onRefresh()} />
            )}

          </div>
        </div>
      )}

      {/* Reject Case Dialog Modal */}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminPortal.tsx', code);
