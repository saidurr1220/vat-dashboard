import { toast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export const showToast = {
    success: (message: string, title?: string) => {
        toast({
            title: title || "Success",
            description: message,
            variant: "default",
        })
    },

    error: (message: string, title?: string) => {
        toast({
            title: title || "Error",
            description: message,
            variant: "destructive",
        })
    },

    warning: (message: string, title?: string) => {
        toast({
            title: title || "Warning",
            description: message,
            variant: "default",
        })
    },

    info: (message: string, title?: string) => {
        toast({
            title: title || "Info",
            description: message,
            variant: "default",
        })
    }
}