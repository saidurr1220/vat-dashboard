async function testDeleteAPI() {
    try {
        console.log('Testing delete API...');

        // First get a record to delete
        const getResponse = await fetch('http://localhost:3000/api/imports');
        const records = await getResponse.json();

        if (records.length === 0) {
            console.log('No records to delete');
            return;
        }

        const recordToDelete = records[0];
        console.log('Deleting record:', recordToDelete.id, recordToDelete.boeNo);

        // Try to delete it
        const deleteResponse = await fetch(`http://localhost:3000/api/imports/${recordToDelete.id}`, {
            method: 'DELETE',
        });

        console.log('Delete response status:', deleteResponse.status);

        if (deleteResponse.ok) {
            const result = await deleteResponse.json();
            console.log('Delete success:', result);
        } else {
            const error = await deleteResponse.text();
            console.log('Delete error:', error);
        }

    } catch (error) {
        console.error('Test error:', error);
    }
    process.exit(0);
}

testDeleteAPI();