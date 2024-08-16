### WIBU EVENT

untuk komunikasi data realtime pada project nextjs

### CLIENT

layout.tsx.  

```tsx
import { Stack } from "@mantine/core";
import { ENV } from "../../../types/env";
import {EventProvider} from "wibu-event/client"
const { EVENT_SERVICE_ACCOUNT_CLIENT }: Record<ENV, string> = process.env as any

export default function Layout({ children, qr }: { children: React.ReactNode, qr: React.ReactNode }) {
    return <Stack>
        <EventProvider config={EVENT_SERVICE_ACCOUNT_CLIENT} projectId="wa" listSubscribe={["qr", "test", "test2"]}>
            {qr}
            {children}
        </EventProvider>
    </Stack>
}
```

ui.tsx.  

```tsx
'use client'
import { Box, Button, Stack } from "@mantine/core"
import { useState } from "react"
import QRCode from "react-qr-code"
import { useEventClient } from "wibu-event/client"

export function HandleQr({ config }: { config: string }) {
    const [qrCode, setQrCode] = useState(null)
    const [val, setVal] = useEventClient()

    return <Stack>
        {JSON.stringify(val)}
        <Button onClick={() => {
            setVal({ id: "qr", val: "qr code" + Math.random() })
        }}>set</Button>
        {val?.val && <Box p={"sm"} bg={"white"}>
            <QRCode value={val?.val} />
        </Box>}
    </Stack>
}
```

### SERVER

server.ts  

```ts
import { eventServer } from 'wibu-event/server'

const event = eventServer({ projectId: "wa" })

event.onChange("qr", (val) => {
    console.log(val)
})

function setQr() {
    event.set("qr", "qr code")
}
```

