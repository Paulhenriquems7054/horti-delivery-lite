import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [importCategory, setImportCategory] = useState("hortifruti");
    const [importing, setImporting] = useState(false);
    const navigate = useNavigate();

    const handleImportDatabase = async () => {
        setImporting(true);
        let items = [];
        if (importCategory === "mercearia") {
            items = [
                { name: "Arroz Tio João 5kg", price: 29.90, active: true },
                { name: "Feijão Carioca 1kg", price: 8.50, active: true },
                { name: "Macarrão Espaguete 500g", price: 4.20, active: true },
                { name: "Óleo de Soja 900ml", price: 6.80, active: true },
                { name: "Açúcar Refinado 1kg", price: 4.90, active: true },
                { name: "Café Torrado 500g", price: 18.90, active: true },
                { name: "Sal Refinado 1kg", price: 2.10, active: true },
                { name: "Farinha de Trigo 1kg", price: 5.50, active: true },
                { name: "Leite Integral 1L", price: 5.90, active: true },
                { name: "Biscoito Recheado", price: 3.50, active: true }
            ];
        } else {
            items = [
                { name: "Banana Prata (Dúzia)", price: 8.90, active: true },
                { name: "Maçã Gala (kg)", price: 11.50, active: true },
                { name: "Laranja Pera (kg)", price: 5.50, active: true },
                { name: "Tomate Carmem (kg)", price: 9.90, active: true },
                { name: "Cebola Nacional (kg)", price: 6.80, active: true },
                { name: "Batata Lavada (kg)", price: 7.50, active: true },
                { name: "Cenoura (kg)", price: 5.90, active: true },
                { name: "Alface Crespa (un)", price: 3.50, active: true },
                { name: "Cheiro Verde (maço)", price: 2.50, active: true },
                { name: "Pimentão Verde (kg)", price: 8.90, active: true }
            ];
        }

        const { error } = await supabase.from("products").insert(items);
        setImporting(false);

        if (error) {
            toast.error("Erro ao importar: " + error.message);
        } else {
            toast.success(`Foram importados ${items.length} itens de ${importCategory}!`);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Login bem-sucedido");
            navigate("/admin");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <Leaf className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h1 className="text-3xl font-extrabold text-foreground">Acesso Admin</h1>
                    <p className="text-muted-foreground">horti-delivery-lite</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>

                <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-center text-foreground">Importar Banco de Dados</h2>
                    <div className="space-y-2">
                        <Label>Selecione a Categoria</Label>
                        <Select value={importCategory} onValueChange={setImportCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hortifruti">Hortifruti</SelectItem>
                                <SelectItem value="mercearia">Mercearia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full h-12 text-md font-bold text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                        onClick={handleImportDatabase}
                        disabled={importing}
                    >
                        {importing ? "Importando..." : "Importar Mercadorias"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
