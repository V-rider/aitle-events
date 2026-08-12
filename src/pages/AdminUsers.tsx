import { Trash2, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { initials } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  lastSignedIn: string | null;
}

interface InviteRow {
  id: string;
  email: string;
  status: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [me, setMe] = useState("");
  const [email, setEmail] = useState("");

  function load() {
    api
      .get<{ users: UserRow[]; invites: InviteRow[]; me: string }>("/api/admin/users")
      .then((d) => {
        setUsers(d.users);
        setInvites(d.invites);
        setMe(d.me);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/api/admin/invites", { email });
    setEmail("");
    load();
  }

  async function removeUser(userId: string) {
    await api.delete(`/api/admin/users/${userId}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage who has admin access to the AiTLE events console
        </p>
      </div>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Users appear here after they sign in for the first time. Admins can manage events,
              attendance, and settings.
            </p>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {users.map((user) => {
                  const isMe = user.email === me;
                  return (
                    <div key={user.id} className="rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                          {initials(user.name || user.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium leading-snug">
                            {user.name || user.email}
                            {isMe ? " (you)" : ""}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge>{user.role}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.lastSignedIn
                                ? new Date(user.lastSignedIn).toLocaleString()
                                : "Never signed in"}
                            </span>
                          </div>
                          {!isMe ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full"
                              onClick={() => removeUser(user.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                              Remove Admin
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Last Signed In</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isMe = user.email === me;
                      return (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-white">
                                {initials(user.name || user.email)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.name || user.email}
                                  {isMe ? " (you)" : ""}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge>{user.role}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {user.lastSignedIn
                              ? new Date(user.lastSignedIn).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {isMe ? (
                              "—"
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeUser(user.id)}
                              >
                                <UserMinus className="h-4 w-4" />
                                Remove Admin
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Invite Admin by Email</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pre-authorize an email address for admin access. When that person signs in for the
            first time with Google using this email, they are automatically granted admin rights.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={invite}>
            <Input
              type="email"
              required
              className="h-11"
              placeholder="e.g. colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="h-11 shrink-0">
              Add Invite
            </Button>
          </form>
          <div className="space-y-2">
            {invites.map((inviteRow) => (
              <div
                key={inviteRow.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{inviteRow.email}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={inviteRow.status === "accepted" ? "success" : "outline"}>
                    {inviteRow.status === "accepted" ? "Accepted" : "Pending"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await api.delete(`/api/admin/invites/${inviteRow.id}`);
                      load();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The invited person signs in via the Admin button using the same Google account email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
