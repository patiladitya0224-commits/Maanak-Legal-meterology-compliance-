import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { User } from "../types";
import PageHeader from "../components/PageHeader";
import Crumbs from "../components/Crumbs";
import { useToast } from "../toast";

export default function UsersAdmin() {
  const qc = useQueryClient();
  const push = useToast((s) => s.push);
  const q = useQuery({ queryKey: ["users"], queryFn: () => api.users() as Promise<User[]> });
  const mut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patchUser(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      push("Role updated");
    },
  });

  return (
    <div className="space-y-6">
      <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Officers" }]} />
      <PageHeader
        kicker="RBAC"
        title="Officers & roles"
        subtitle="Admin can reassign roles. Officers create scans; viewers are read-only; citizens can submit captures."
      />
      <div className="glass rounded-2xl divide-y divide-white/5">
        {(q.data || []).map((u) => (
          <div key={u.id} className="px-5 py-4 flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-brass-400/15 grid place-items-center text-xs text-brass-300">
              {u.name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div>{u.name}</div>
              <div className="text-xs text-stone-500">
                {u.email} · {u.jurisdiction}
              </div>
            </div>
            <select
              value={u.role}
              onChange={(e) => mut.mutate({ id: u.id, role: e.target.value })}
              className="bg-ink-800 border border-white/10 rounded-lg px-2 py-1 text-sm"
            >
              <option value="admin">admin</option>
              <option value="officer">officer</option>
              <option value="viewer">viewer</option>
              <option value="citizen">citizen</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
